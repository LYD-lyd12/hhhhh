import httpx
import uuid
import logging
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import MCPServer
from app.security import encryption_service
from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

class MCPService:
    def __init__(self, db: Session):
        self.db = db

    def create_server(self, name: str, server_url: str, 
                      auth_type: str = "none", auth_config: Optional[dict] = None,
                      description: Optional[str] = None, timeout: int = 30000) -> MCPServer:
        existing = self.db.query(MCPServer).filter(MCPServer.name == name).first()
        if existing:
            raise ValueError(f"MCP Server '{name}' 已存在")

        encrypted_config = None
        if auth_config:
            encrypted_config = encryption_service.encrypt(auth_config)

        server = MCPServer(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            server_url=server_url,
            auth_type=auth_type,
            auth_config=encrypted_config,
            tools=[],
            status="inactive",
            timeout=timeout
        )

        self.db.add(server)
        self.db.commit()
        self.db.refresh(server)

        logger.info(f"创建MCP Server: {name} ({server_url})")
        return server

    def get_server(self, server_id: str) -> Optional[MCPServer]:
        return self.db.query(MCPServer).filter(MCPServer.id == server_id).first()

    def list_servers(self, status: Optional[str] = None, 
                     page: int = 1, page_size: int = 10) -> Tuple[List[MCPServer], int]:
        query = self.db.query(MCPServer)
        
        if status:
            query = query.filter(MCPServer.status == status)
        
        total = query.count()
        offset = (page - 1) * page_size
        servers = query.order_by(MCPServer.created_at.desc()).offset(offset).limit(page_size).all()
        
        return servers, total

    def update_server(self, server_id: str, **kwargs) -> MCPServer:
        server = self.get_server(server_id)
        if not server:
            raise ValueError("MCP Server不存在")

        if "name" in kwargs:
            existing = self.db.query(MCPServer).filter(
                MCPServer.name == kwargs["name"],
                MCPServer.id != server_id
            ).first()
            if existing:
                raise ValueError(f"MCP Server名称 '{kwargs['name']}' 已存在")
            server.name = kwargs["name"]

        if "description" in kwargs:
            server.description = kwargs["description"]
        
        if "server_url" in kwargs:
            server.server_url = kwargs["server_url"]
        
        if "auth_type" in kwargs:
            server.auth_type = kwargs["auth_type"]
        
        if "auth_config" in kwargs:
            if kwargs["auth_config"]:
                server.auth_config = encryption_service.encrypt(kwargs["auth_config"])
            else:
                server.auth_config = None
        
        if "status" in kwargs:
            server.status = kwargs["status"]
        
        if "timeout" in kwargs:
            server.timeout = kwargs["timeout"]

        self.db.commit()
        self.db.refresh(server)
        
        logger.info(f"更新MCP Server: {server.name}")
        return server

    def delete_server(self, server_id: str) -> bool:
        server = self.get_server(server_id)
        if not server:
            raise ValueError("MCP Server不存在")

        self.db.delete(server)
        self.db.commit()
        
        logger.info(f"删除MCP Server: {server.name}")
        return True

    def _build_headers(self, server: MCPServer) -> Dict[str, str]:
        headers = {}
        if server.auth_config:
            try:
                config = encryption_service.decrypt(server.auth_config)
                if server.auth_type == "bearer":
                    token = config.get("bearer_token", "")
                    if token:
                        headers["Authorization"] = f"Bearer {token}"
                elif server.auth_type == "api_key":
                    api_key = config.get("api_key", "")
                    header_name = config.get("header_name", "X-API-Key")
                    if api_key:
                        headers[header_name] = api_key
            except Exception as e:
                logger.error(f"解密认证配置失败: {e}")
        
        headers["Content-Type"] = "application/json"
        return headers

    async def test_connection(self, server_id: str) -> Dict[str, Any]:
        server = self.get_server(server_id)
        if not server:
            raise ValueError("MCP Server不存在")

        start_time = datetime.now()
        try:
            async with httpx.AsyncClient(timeout=server.timeout / 1000) as client:
                headers = self._build_headers(server)
                response = await client.get(f"{server.server_url}/ping", headers=headers)
                
                response_time_ms = (datetime.now() - start_time).total_seconds() * 1000
                
                server.health_status = "healthy"
                server.last_health_check = datetime.now()
                
                if response.json():
                    server.api_version = response.json().get("version", "1.0")
                
                self.db.commit()
                
                return {
                    "success": True,
                    "message": "连接成功",
                    "response_time_ms": int(response_time_ms),
                    "api_version": server.api_version
                }
        
        except httpx.ConnectError:
            response_time_ms = (datetime.now() - start_time).total_seconds() * 1000
            server.health_status = "unhealthy"
            server.last_health_check = datetime.now()
            self.db.commit()
            return {
                "success": False,
                "message": "网络连接失败",
                "response_time_ms": int(response_time_ms)
            }
        except httpx.TimeoutException:
            response_time_ms = (datetime.now() - start_time).total_seconds() * 1000
            server.health_status = "unhealthy"
            server.last_health_check = datetime.now()
            self.db.commit()
            return {
                "success": False,
                "message": "请求超时",
                "response_time_ms": int(response_time_ms)
            }
        except Exception as e:
            response_time_ms = (datetime.now() - start_time).total_seconds() * 1000
            server.health_status = "unhealthy"
            server.last_health_check = datetime.now()
            self.db.commit()
            return {
                "success": False,
                "message": str(e),
                "response_time_ms": int(response_time_ms)
            }

    async def fetch_tools(self, server_id: str) -> List[Dict[str, Any]]:
        server = self.get_server(server_id)
        if not server:
            raise ValueError("MCP Server不存在")

        try:
            async with httpx.AsyncClient(timeout=server.timeout / 1000) as client:
                headers = self._build_headers(server)
                response = await client.get(f"{server.server_url}/tools", headers=headers)
                
                tools = response.json()
                server.tools = tools
                server.status = "active"
                self.db.commit()
                
                logger.info(f"获取MCP Server工具列表: {server.name}, 工具数: {len(tools)}")
                return tools
        
        except Exception as e:
            logger.error(f"获取工具列表失败: {e}")
            raise ValueError(f"获取工具列表失败: {str(e)}")

    async def call_tool(self, server_id: str, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        server = self.get_server(server_id)
        if not server:
            raise ValueError("MCP Server不存在")

        if server.status != "active":
            raise ValueError("MCP Server未激活")

        start_time = datetime.now()
        try:
            async with httpx.AsyncClient(timeout=server.timeout / 1000) as client:
                headers = self._build_headers(server)
                payload = {
                    "tool_name": tool_name,
                    "parameters": parameters
                }
                response = await client.post(
                    f"{server.server_url}/tools/{tool_name}/call",
                    headers=headers,
                    json=payload
                )
                
                response_time_ms = (datetime.now() - start_time).total_seconds() * 1000
                
                return {
                    "success": True,
                    "result": response.json(),
                    "response_time_ms": int(response_time_ms)
                }
        
        except Exception as e:
            response_time_ms = (datetime.now() - start_time).total_seconds() * 1000
            return {
                "success": False,
                "error": str(e),
                "response_time_ms": int(response_time_ms)
            }

    def get_all_tools(self) -> List[Dict[str, Any]]:
        active_servers = self.db.query(MCPServer).filter(MCPServer.status == "active").all()
        
        all_tools = []
        for server in active_servers:
            tools = server.tools or []
            for tool in tools:
                tool["server_id"] = server.id
                tool["server_name"] = server.name
                tool["server_url"] = server.server_url
                all_tools.append(tool)
        
        return all_tools

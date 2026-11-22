# 云上禅寺多人服务

这是云上禅寺多人 MVP 的 CloudBase 云托管 WebSocket 服务。当前版本支持：

- 房间加入/离开
- 最多 10 人同房间（可用 `MAX_PLAYERS` 调整）
- 玩家位置、朝向、行走状态同步
- 跪拜、炫技、敲钟、木鱼、上香动作广播
- 同房间文字聊天与最近 50 条房间消息
- 心跳、断线清理、客户端自动重连

当前版本故意不接入数据库和账号体系，房间状态全部在服务进程内存中，适合先验证多人体验。

## 本地运行

```bash
cd server
npm install
npm start
```

服务默认监听 `3000`，健康检查地址是 `http://127.0.0.1:3000/healthz`。

前端本地打开时可以通过 URL 覆盖联机地址：

```text
http://localhost:8000/cloud-worship/?ws=ws://127.0.0.1:3000/ws&room=demo
```

## 部署到 CloudBase 云托管

1. 在 CloudBase 控制台创建云托管服务，选择本目录作为代码来源。
2. 构建方式选择 Dockerfile，端口填写 `3000`。
3. 健康检查路径填写 `/healthz`。
4. 最小实例数和最大实例数都设为 `1`，避免缩容断开 WebSocket，也避免多实例导致房间状态分裂。
5. 开启公网访问，并绑定自定义域名；WebSocket 路径是 `/ws`。
6. 在前端 `cloud-worship/index.html` 中配置：

```html
<script>
  window.CLOUD_TEMPLE_WS = "wss://你的云托管域名/ws";
</script>
```

如果使用 CloudBase 默认域名，也需要把完整 `wss://` 地址填进去。

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 服务监听端口 |
| `MAX_PLAYERS` | `10` | 单房间最大人数，范围 2–20 |

## 协议

客户端 -> 服务端：

```json
{ "type": "join", "roomId": "lobby", "nickname": "香客" }
{ "type": "move", "x": 0, "z": 3, "heading": 3.14, "animation": "walk" }
{ "type": "action", "action": "pray" }
{ "type": "chat", "text": "一起静心吧" }
{ "type": "ping" }
```

服务端 -> 客户端：

```json
{ "type": "welcome", "playerId": "...", "roomId": "lobby", "players": [], "messages": [] }
{ "type": "snapshot", "serverTime": 0, "players": [] }
{ "type": "player_join", "player": {} }
{ "type": "player_leave", "playerId": "..." }
{ "type": "action", "playerId": "...", "animation": "bell", "duration": 1400 }
{ "type": "chat", "playerId": "...", "nickname": "香客", "text": "一起静心吧", "at": 0 }
{ "type": "pong" }
```

## 后续建议

- 接入 CloudBase 身份认证，服务端校验登录态后再分配 `playerId`
- 房间元数据和香火统计写入 CloudBase 数据库
- 多实例扩容时引入 Redis 做房间路由和广播
- 增加消息频率限制、昵称过滤和房间容量策略

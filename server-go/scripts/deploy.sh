#!/bin/bash

# 构建项目
echo "Building project..."
go build -o kops main.go

# 部署项目
echo "Deploying project..."
# 这里可以添加部署项目的命令，例如将二进制文件复制到目标服务器
scp kops user@server:/path/to/deploy

# 重启服务
echo "Restarting service..."
ssh user@server 'systemctl restart kops'

echo "Deployment complete."

#!/bin/bash

# 定义文件路径和URL
KEY_FILE="key.txt"
README_FILE="README.md"
URL="https://book.komr.cn/key.php"
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# 获取旧密钥（如果存在）
OLD_KEY=""
if [ -f "$KEY_FILE" ]; then
    OLD_KEY=$(cat "$KEY_FILE")
fi

# 请求页面并提取密钥
NEW_KEY=$(curl -s $URL | 
    sed -n '/最新密钥为: /{s/.*最新密钥为: \([a-z0-9]\{12\}\).*/\1/p;q}')

# 验证密钥格式
if [[ ! $NEW_KEY =~ ^[a-z0-9]{12}$ ]]; then
    echo "密钥提取失败，请检查页面结构"
    exit 1
fi

# 保存新密钥
echo $NEW_KEY > "$KEY_FILE"

# 准备更新信息
if [ -z "$OLD_KEY" ]; then
    KEY_STATUS="初始密钥"
elif [ "$OLD_KEY" == "$NEW_KEY" ]; then
    KEY_STATUS="密钥未变化"
else
    KEY_STATUS="密钥已更新: $OLD_KEY -> $NEW_KEY"
fi

# 更新 README.md
cat > "$README_FILE" << EOF
# Keys Auto Update

当前密钥: \`$NEW_KEY\`  
当前更新时间: \`$CURRENT_TIME\`   
更新状态: \`$KEY_STATUS\`  
  
## 说明
此仓库仅用于调试 
EOF

echo "更新完成："
echo "密钥: $NEW_KEY"
echo "更新时间: $CURRENT_TIME"
echo "状态: $KEY_STATUS"

#!/bin/bash

# 定义密钥文件路径和URL
KEY_FILE="key.txt"
URL="https://book.komr.cn/key.php"

# 请求页面并提取密钥
KEY=$(curl -s $URL | 
  sed -n '/最新密钥为: /{s/.*最新密钥为: \([a-z0-9]\{12\}\).*/\1/p;q}')

# 验证并保存密钥
if [[ $KEY =~ ^[a-z0-9]{12}$ ]]; then
  echo $KEY > $KEY_FILE
  echo "密钥已更新: $KEY"
else
  echo "密钥提取失败，请检查页面结构"
  exit 1
fi

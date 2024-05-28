Forked from https://github.com/YMFE/yapi
 
新增功能:
1. 无需登陆访问文档
需要手动把guest用户添加到项目中
2. 导出文档可以选择导出的分类
3. 可以选择导出为docx文档


## 快速部署
```bash
docker-compose up -d
```

## 手动部署
```
cd yapi/yapi
npm install 
npm run start
```

## 添加管理员的方法

1. 更新用户为管理员

以注册邮箱your@email.com为例.
```
use yapi
db.user.update({"email": "your@email.com"}, {$set: {"role": "admin"}})
```                                                                                                                                                                                    

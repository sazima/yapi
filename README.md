Forked from https://github.com/YMFE/yapi
 
添加免登录功能. 如果想登录管理员账户, 点击右上角`退出`然后`登录`.


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

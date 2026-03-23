# Azure Setup for Game of Consults Server

This guide explains how to deploy the Game of Consults Node.js server to Azure App Service using the Azure CLI. It follows Solita Azure sandbox conventions.

---

## 1. Login to Azure

Login and select your subscription:
```sh
az login
```

---

## 2. Set Up Environment Variables

Follow Solita conventions for naming. Example:
```sh
export GAMEOFCONSULTS_AZURE_APP_NAME=gameofconsults-demo   # must be unique, e.g. gameofconsults-tampere
export GAMEOFCONSULTS_AZURE_SID=<your-subscription-id>      # get from az login
export GAMEOFCONSULTS_AZURE_RG=janne_rintanen_rg            # e.g. yourname_rg
export GAMEOFCONSULTS_AZURE_OWNER=<your-username>           # e.g. janneri
export GAMEOFCONSULTS_AZURE_DUE_DATE=2026-05-05             # e.g. 2026-05-05
```

---

## 3. Create a Resource Group

```sh
az group create --name $GAMEOFCONSULTS_AZURE_RG \
    --location northeurope \
    --tags Owner=$GAMEOFCONSULTS_AZURE_OWNER DueDate=$GAMEOFCONSULTS_AZURE_DUE_DATE
```

---

## 4. Create Azure App Service Plan & Web App

```sh
az appservice plan create --name ${GAMEOFCONSULTS_AZURE_APP_NAME}-plan \
    --resource-group $GAMEOFCONSULTS_AZURE_RG --sku B1 --is-linux

az webapp create --resource-group $GAMEOFCONSULTS_AZURE_RG \
    --plan ${GAMEOFCONSULTS_AZURE_APP_NAME}-plan \
    --name $GAMEOFCONSULTS_AZURE_APP_NAME \
    --runtime "NODE|18-lts"
```

---

## 5. Configure WebSockets (Important!)

Free tier Linux does not support WebSockets. Use at least B1 tier. Enable WebSockets in the portal after deployment:
- Go to your App Service in https://portal.azure.com/
- Settings > Configuration > General settings > Web Sockets: **On**

---

## 6. Build Locally (Optional)

Test locally before deploying:
```sh
npm install
npm run build
npm start
```
Open http://localhost:3000/

---

## 7. Deploy to Azure

Deploy using zip deployment:
```sh
# Create a zip of your app (from project root)
zip -r app.zip . -x "node_modules/*"

# Deploy to Azure
az webapp deploy --resource-group $GAMEOFCONSULTS_AZURE_RG \
    --name $GAMEOFCONSULTS_AZURE_APP_NAME \
    --src-path app.zip --type zip
```

---

## 8. Check Logs

```sh
az webapp log tail --name $GAMEOFCONSULTS_AZURE_APP_NAME --resource-group $GAMEOFCONSULTS_AZURE_RG
```

---

## 9. Clean Up

To remove all resources:
```sh
az group delete --name $GAMEOFCONSULTS_AZURE_RG
```

---

## 10. Notes
- The app will be available at: `https://<your-app-name>.azurewebsites.net`
- For multiple instances, use unique app names (e.g. gameofconsults-tampere, gameofconsults-helsinki)
- If you change the port in your app, set the `PORT` environment variable in Azure to match (default is 3000)
- For advanced configuration, see Azure App Service Node.js docs

---

For game admin instructions, see `admin_guide.md`.


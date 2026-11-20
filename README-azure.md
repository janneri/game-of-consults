# Azure Setup for Game of Consultants Server

This guide explains how to deploy the Game of Consultants Node.js server to Azure App Service using the Azure CLI. It follows Solita Azure sandbox conventions.

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
export GAMEOFCONSULTANTS_AZURE_APP_NAME=gameofconsultants-demo   # must be unique, e.g. gameofconsultants-tampere
export GAMEOFCONSULTANTS_AZURE_SID=<your-subscription-id>      # get from az login
export GAMEOFCONSULTANTS_AZURE_RG=janne_rintanen_rg            # e.g. yourname_rg
export GAMEOFCONSULTANTS_AZURE_OWNER=<your-username>           # e.g. janneri
export GAMEOFCONSULTANTS_AZURE_DUE_DATE=2026-12-31             # must match your policy's DueDate pattern
```

The current sandbox policy requires `DueDate` to match `2026-##-##`, so a date in 2027 is rejected. Ask the subscription administrator to update the policy pattern if your due date must be outside 2026.

---

## 3. Create a Resource Group

```sh
az group create --name $GAMEOFCONSULTANTS_AZURE_RG \
    --location northeurope \
    --tags "Owner=$GAMEOFCONSULTANTS_AZURE_OWNER" "DueDate=$GAMEOFCONSULTANTS_AZURE_DUE_DATE"
```

---

## 4. Create Azure App Service Plan & Web App

```sh
az appservice plan create --name ${GAMEOFCONSULTANTS_AZURE_APP_NAME}-plan \
    --resource-group $GAMEOFCONSULTANTS_AZURE_RG --sku B1 --is-linux

az webapp create --resource-group $GAMEOFCONSULTANTS_AZURE_RG \
    --plan ${GAMEOFCONSULTANTS_AZURE_APP_NAME}-plan \
    --name $GAMEOFCONSULTANTS_AZURE_APP_NAME \
    --runtime "NODE|24-lts"
```

---

## 5. Configure WebSockets (Important!)

Use at least the B1 tier for WebSockets. Enable them and keep the app warm with:
```sh
az webapp config set --resource-group "$GAMEOFCONSULTANTS_AZURE_RG" \
    --name "$GAMEOFCONSULTANTS_AZURE_APP_NAME" \
    --web-sockets-enabled true --always-on true
```

---

## 6. Test the Build Locally (Optional)

Build and run locally before deploying:
```sh
npm ci
npm run build
npm start
```
Open http://localhost:3000/

---

## 7. Deploy to Azure

Enable App Service build automation so Azure installs dependencies and runs the `build` script during deployment:
```sh
az webapp config appsettings set --resource-group "$GAMEOFCONSULTANTS_AZURE_RG" \
    --name "$GAMEOFCONSULTANTS_AZURE_APP_NAME" \
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

From the project root, package only the app source and required build files, then deploy:
```sh
rm -f app.zip
zip -r app.zip package.json package-lock.json tsconfig.json src public
az webapp deployment source config-zip \
    --resource-group "$GAMEOFCONSULTANTS_AZURE_RG" \
    --name "$GAMEOFCONSULTANTS_AZURE_APP_NAME" --src app.zip
```

This Kudu ZipDeploy path runs Oryx to install dependencies and compile TypeScript. Azure CLI marks the command deprecated; `az webapp deploy --type zip` did not run the remote build in this setup and left out `dist/server.js`. Use the full source ZIP for updates so dependencies and build output are included; do not replace it with a one-file static deployment.

Register the example bots against the deployed app from the project root:
```sh
./send_all_bots.sh "https://${GAMEOFCONSULTANTS_AZURE_APP_NAME}.azurewebsites.net"
```

---

## 8. Check Logs

```sh
az webapp log tail --name $GAMEOFCONSULTANTS_AZURE_APP_NAME --resource-group $GAMEOFCONSULTANTS_AZURE_RG
```

---

## 9. Clean Up

To remove all resources:
```sh
az group delete --name $GAMEOFCONSULTANTS_AZURE_RG
```

---

## 10. Notes
- The app will be available at: `https://<your-app-name>.azurewebsites.net`
- For multiple instances, use unique app names (e.g. gameofconsultants-tampere, gameofconsultants-helsinki)
- If you change the port in your app, set the `PORT` environment variable in Azure to match (default is 3000)
- For advanced configuration, see Azure App Service Node.js docs

---

For game admin instructions, see `admin_guide.md`.

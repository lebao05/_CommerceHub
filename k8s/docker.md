Turoial

1."docker images"
List all docker images being present in the docker desktop.


2. Storage 

-Docker registires is places for storing images built by us.

-Docker hub is a registry, holding images.

-Images have multiple versions.

For examples:

Redis has multiple versions

3. Pull image

Docker pull app:version

Ex: docker pull nginx:1.23

4. Run image

Docker run app:version

Docker ps ( list all containers)

Docker logs containerId ( see logs within a container)

Docker run -d -p hostport:containerport app:version

--name nameofapp


5. Build Image

Dockerfile

FROM Node:19-alpine
COPY package.json /app/
COPY src /app/
WORKDIR /app
RUN npm install
CMD ["Node","Server.js"]


Build it
Docker build -t(tag) my-app:1.0(appname:version) .(where docker file is located)



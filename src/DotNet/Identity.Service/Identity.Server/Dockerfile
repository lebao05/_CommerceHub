FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5001
ENV ASPNETCORE_URLS=http://+:5001

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/DotNet/Identity.Service/Identity.Server/Identity.Server.csproj", "src/DotNet/Identity.Service/Identity.Server/"]
RUN dotnet restore "src/DotNet/Identity.Service/Identity.Server/Identity.Server.csproj"
COPY . .
WORKDIR "/src/src/DotNet/Identity.Service/Identity.Server"
RUN dotnet publish "Identity.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Identity.Server.dll"]

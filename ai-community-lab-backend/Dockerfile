# Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY AiCommunityLab.Api.csproj .
RUN dotnet restore AiCommunityLab.Api.csproj
COPY . .
RUN dotnet publish AiCommunityLab.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Run (Debian-based image — fewer globalization issues with EF/Npgsql than Alpine)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "AiCommunityLab.Api.dll"]

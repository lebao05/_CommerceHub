using Microsoft.AspNetCore.Authorization;

namespace BuildingBlocks.Infrastructure.Auth
{
    public interface IAuthRequest : IAuthorizationRequirement
    {
    }
}

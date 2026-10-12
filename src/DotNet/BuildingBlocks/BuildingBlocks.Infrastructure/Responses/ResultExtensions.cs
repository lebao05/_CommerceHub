using BuildingBlocks.Core.Domain;
using BuildingBlocks.Core.Domain.Shared;
using Microsoft.AspNetCore.Http;

// BuildingBlocks.Core.Domain also declares an empty marker called IResult. The ASP.NET meaning is the
// one that matters in this file, so bind the name explicitly instead of relying on import order.
using IResult = Microsoft.AspNetCore.Http.IResult;

namespace BuildingBlocks.Infrastructure.Responses
{
    /// <summary>
    /// Turns a <see cref="Result"/> into an HTTP response. This is the only place that decides how an
    /// error code becomes a status code, so that rule stays in one reviewable spot instead of being
    /// re-invented at every endpoint.
    /// </summary>
    public static class ResultExtensions
    {
        /// <summary>
        /// Maps an error code to a status code by its conventional suffix, e.g. "Category.NotFound" -> 404.
        /// Anything unrecognised becomes 400, the safe default for a rejected request.
        /// </summary>
        private static int ResolveStatusCode(Error error) => error.Code switch
        {
            _ when error.Code.EndsWith(".NotFound", StringComparison.Ordinal) => StatusCodes.Status404NotFound,
            _ when error.Code.EndsWith(".AlreadyExists", StringComparison.Ordinal) => StatusCodes.Status409Conflict,
            _ when error.Code.EndsWith(".Conflict", StringComparison.Ordinal) => StatusCodes.Status409Conflict,
            _ when error.Code.EndsWith(".Unauthorized", StringComparison.Ordinal) => StatusCodes.Status401Unauthorized,
            _ when error.Code.EndsWith(".Forbidden", StringComparison.Ordinal) => StatusCodes.Status403Forbidden,
            _ => StatusCodes.Status400BadRequest
        };

        /// <summary>Body shape for a failed result. Kept identical to the shape ExceptionMiddleware emits.</summary>
        private static IResult Failure(IReadOnlyList<Error> errors) =>
            Results.Json(
                ResultModel<string>.Create(
                    string.Empty,
                    true,
                    string.Join("; ", errors.Select(error => error.Message))),
                statusCode: ResolveStatusCode(errors[0]));

        /// <summary>
        /// Converts a value-less result. A success yields 204 No Content unless the caller overrides it.
        /// </summary>
        public static IResult ToHttpResult(this Result result, Func<IResult>? onSuccess = null)
        {
            if (result.IsFailure)
            {
                return Failure(result.Errors);
            }

            return onSuccess?.Invoke() ?? Results.NoContent();
        }

        /// <summary>
        /// Converts a value-carrying result. A success yields 200 with the value as the body unless the
        /// caller overrides it, for example to return 201 Created with a Location header.
        /// </summary>
        public static IResult ToHttpResult<TValue>(this Result<TValue> result, Func<TValue, IResult>? onSuccess = null)
        {
            if (result.IsFailure)
            {
                return Failure(result.Errors);
            }

            return onSuccess?.Invoke(result.Value) ?? Results.Ok(result.Value);
        }
    }
}

using System.Text.Json;

namespace BuildingBlocks.Core.Domain
{
    public record ResultModel<T>(T Data, bool IsError = false, string ErrorMessage = default!) : IResult
        where T : notnull
    {
        public static ResultModel<T> Create(T data, bool isError = false, string errorMessage = default!)
        {
            return new ResultModel<T>(data, isError, errorMessage);
        }

        public override string ToString()
        {
            return JsonSerializer.Serialize(this);
        }
    }
}

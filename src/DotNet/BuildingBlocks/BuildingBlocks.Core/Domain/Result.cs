using System;
using System.Collections.Generic;
using System.Linq;

namespace BuildingBlocks.Core.Domain
{
    public class Result
    {
        public bool IsSuccess { get; }
        public string Error { get; }
        public bool IsFailure => !IsSuccess;

        protected Result(bool isSuccess, string error)
        {
            if (isSuccess && !string.IsNullOrEmpty(error))
                throw new InvalidOperationException("A successful result cannot have an error.");
            
            if (!isSuccess && string.IsNullOrEmpty(error))
                throw new InvalidOperationException("A failed result must have an error.");

            IsSuccess = isSuccess;
            Error = error;
        }

        public static Result Success() => new Result(true, string.Empty);
        public static Result Failure(string error) => new Result(false, error);
        public static Result<T> Success<T>(T value) => new Result<T>(value, true, string.Empty);
        public static Result<T> Failure<T>(string error) => new Result<T>(default, false, error);
    }

    public class Result<T> : Result
    {
        public T Value { get; }

        protected internal Result(T value, bool isSuccess, string error) : base(isSuccess, error)
        {
            Value = value;
        }
    }

    public class ValidationResult : Result
    {
        public IEnumerable<string> Errors { get; }

        protected ValidationResult(bool isSuccess, IEnumerable<string> errors) 
            : base(isSuccess, errors?.FirstOrDefault() ?? string.Empty)
        {
            Errors = errors ?? Enumerable.Empty<string>();
        }

        public static ValidationResult Success() => new ValidationResult(true, null);
        public static ValidationResult Failure(params string[] errors) => new ValidationResult(false, errors);
        public static ValidationResult Failure(IEnumerable<string> errors) => new ValidationResult(false, errors);
    }
}

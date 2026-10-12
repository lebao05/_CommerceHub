namespace BuildingBlocks.Core.Domain.Shared;

/// <summary>
/// Outcome of an operation. A failed result holds one or more <see cref="Error"/> values and no value;
/// a successful result holds the value. Nothing is thrown for an expected failure.
/// </summary>
public class Result<TValue> : Result
{
    private readonly TValue? _value;

    protected internal Result(TValue? value, bool isSuccess, Error[] errors)
        : base(isSuccess, errors) =>
        _value = value;

    protected internal Result(TValue? value, bool isSuccess, Error error)
        : this(value, isSuccess, new[] { error })
    {
    }

    /// <summary>Shorthand for a successful result. Backs the implicit conversion below.</summary>
    protected internal Result(TValue? value)
        : this(value, true, Array.Empty<Error>())
    {
    }

    /// <summary>Throws when this result is a failure. Only read this after checking <see cref="Result.IsSuccess"/>.</summary>
    public TValue Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("The value of a failure result can not be accessed.");

    public static implicit operator Result<TValue>(TValue? value) => Create(value);

    /// <summary>A null value counts as a failure, so the implicit conversion cannot yield a null value on a success.</summary>
    private static Result<TValue> Create(TValue? value) => value is not null
        ? Success(value)
        : Failure(Error.NullValue);

    public static Result<TValue> Success(TValue value) => new(value, true, Array.Empty<Error>());

    public static new Result<TValue> Failure(Error error) => new(default, false, new[] { error });

    public static new Result<TValue> Failure(IEnumerable<Error> errors) => new(default, false, errors.ToArray());

    /// <summary>
    /// Transforms the value on success. On failure the errors are carried over untouched, so the
    /// caller still sees why the original operation failed.
    /// </summary>
    public Result<TOutValue> Map<TOutValue>(Func<TValue, TOutValue> func) => IsSuccess
        ? Result<TOutValue>.Success(func(_value!))
        : Result<TOutValue>.Failure(Errors);
}

/// <summary>
/// Non-generic outcome. Use it when there is no value to return; otherwise prefer
/// <see cref="Result{TValue}"/>, which carries the same failure information plus a value.
/// </summary>
public class Result : IResult
{
    protected internal Result(bool isSuccess, Error[] errors)
    {
        // A failure with no reason is the one mistake worth catching here: it produces
        // IsFailure == true with nothing for the caller to report.
        if (!isSuccess && errors.Length == 0)
        {
            throw new ArgumentException("A failed result must carry at least one error.", nameof(errors));
        }

        IsSuccess = isSuccess;
        Errors = errors;
    }

    protected internal Result(bool isSuccess, Error error)
        : this(isSuccess, new[] { error })
    {
    }

    public bool IsSuccess { get; }

    public bool IsFailure => !IsSuccess;

    public IReadOnlyList<Error> Errors { get; }

    public Error FirstError => Errors[0];

    public static Result Success() => new(true, Array.Empty<Error>());

    public static Result Failure(Error error) => new(false, new[] { error });

    public static Result Failure(IEnumerable<Error> errors) => new(false, errors.ToArray());

    public static Result<TValue> Success<TValue>(TValue value) => Result<TValue>.Success(value);

    public static Result<TValue> Failure<TValue>(Error error) => Result<TValue>.Failure(error);

    public static Result<TValue> Failure<TValue>(IEnumerable<Error> errors) => Result<TValue>.Failure(errors);

    /// <summary>Runs a side effect on one branch, then returns this result unchanged for chaining.</summary>
    public Result Match(Action action, Action<Error[]> errorAction)
    {
        if (IsSuccess)
        {
            action();
        }
        else
        {
            errorAction(Errors.ToArray());
        }

        return this;
    }
}

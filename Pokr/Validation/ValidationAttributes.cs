using System.ComponentModel.DataAnnotations;

namespace Pokr.Validation;

/// <summary>
/// Validates that a string is not null, empty, or whitespace
/// </summary>
public class RequiredNotEmptyAttribute : ValidationAttribute
{
    public RequiredNotEmptyAttribute() : base("The {0} field is required and cannot be empty or whitespace.")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is string stringValue)
        {
            return !string.IsNullOrWhiteSpace(stringValue);
        }

        return value != null;
    }
}

/// <summary>
/// Validates that a session code matches the expected format (6 alphanumeric characters)
/// </summary>
public class SessionCodeAttribute : ValidationAttribute
{
    private const int CodeLength = 6;

    public SessionCodeAttribute() : base($"The {{0}} field must be exactly {CodeLength} alphanumeric characters.")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is not string stringValue)
        {
            return false;
        }

        if (stringValue.Length != CodeLength)
        {
            return false;
        }

        return stringValue.All(c => char.IsLetterOrDigit(c));
    }
}

/// <summary>
/// Validates that an estimate value is valid for planning poker
/// </summary>
public class ValidEstimateAttribute : ValidationAttribute
{
    private static readonly int[] ValidEstimates = { 1, 2, 3, 5, 8, 13, 21, -1, -2 };

    public ValidEstimateAttribute() : base("The {0} field must be a valid Fibonacci estimate (1,2,3,5,8,13,21) or special value (? = -1, ☕ = -2).")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is not int intValue)
        {
            return false;
        }

        return ValidEstimates.Contains(intValue);
    }
}

/// <summary>
/// Validates that a final estimate value is valid (no special values)
/// </summary>
public class ValidFinalEstimateAttribute : ValidationAttribute
{
    private static readonly int[] ValidEstimates = { 1, 2, 3, 5, 8, 13, 21 };

    public ValidFinalEstimateAttribute() : base("The {0} field must be a valid Fibonacci estimate (1,2,3,5,8,13,21).")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is not int intValue)
        {
            return false;
        }

        return ValidEstimates.Contains(intValue);
    }
}

/// <summary>
/// Validates that a string has a maximum length and trims whitespace
/// </summary>
public class MaxLengthTrimmedAttribute : MaxLengthAttribute
{
    public MaxLengthTrimmedAttribute(int length) : base(length)
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is string stringValue)
        {
            return base.IsValid(stringValue.Trim());
        }

        return base.IsValid(value);
    }
}

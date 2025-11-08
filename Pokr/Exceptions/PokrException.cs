namespace Pokr.Exceptions;

/// <summary>
/// Base exception class for all Pokr application exceptions
/// </summary>
public class PokrException : Exception
{
    public string ErrorCode { get; }

    public PokrException(string message, string errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }

    public PokrException(string message, string errorCode, Exception innerException) 
        : base(message, innerException)
    {
        ErrorCode = errorCode;
    }
}

/// <summary>
/// Exception thrown when a requested resource is not found
/// </summary>
public class NotFoundException : PokrException
{
    public NotFoundException(string message) 
        : base(message, "NOT_FOUND")
    {
    }

    public NotFoundException(string resourceType, string identifier)
        : base($"{resourceType} with identifier '{identifier}' was not found", "NOT_FOUND")
    {
    }
}

/// <summary>
/// Exception thrown when a business rule validation fails
/// </summary>
public class ValidationException : PokrException
{
    public Dictionary<string, string[]> ValidationErrors { get; }

    public ValidationException(string message, Dictionary<string, string[]> validationErrors)
        : base(message, "VALIDATION_ERROR")
    {
        ValidationErrors = validationErrors;
    }

    public ValidationException(string fieldName, string errorMessage)
        : base($"Validation failed for {fieldName}", "VALIDATION_ERROR")
    {
        ValidationErrors = new Dictionary<string, string[]>
        {
            { fieldName, new[] { errorMessage } }
        };
    }
}

/// <summary>
/// Exception thrown when a resource conflict occurs (e.g., duplicate names)
/// </summary>
public class ConflictException : PokrException
{
    public ConflictException(string message)
        : base(message, "CONFLICT")
    {
    }
}

/// <summary>
/// Exception thrown when a business rule is violated
/// </summary>
public class BusinessRuleException : PokrException
{
    public BusinessRuleException(string message)
        : base(message, "BUSINESS_RULE_VIOLATION")
    {
    }

    public BusinessRuleException(string message, Exception innerException)
        : base(message, "BUSINESS_RULE_VIOLATION", innerException)
    {
    }
}

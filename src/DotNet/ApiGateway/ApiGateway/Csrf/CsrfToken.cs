using System.Security.Cryptography;

namespace ApiGateway.Csrf;

/// <summary>
/// Generates and compares CSRF tokens.
/// </summary>
/// <remarks>
/// <para>
/// The token is a Base64-url encoded random value, which is what the standard double-submit pattern
/// uses. The randomness comes from <see cref="RandomNumberGenerator"/> rather than
/// <see cref="System.Random"/>, because the latter is predictable to anyone who can read the seed
/// and a predictable CSRF token is no token at all.
/// </para>
/// <para>
/// Comparison is constant-time, so a timing oracle cannot be used to recover the token byte-by-byte.
/// This is the standard mitigation for the family of bugs where a server uses
/// <see cref="string.op_Equality(string, string)"/> and the response time leaks how many matched.
/// </para>
/// </remarks>
internal static class CsrfToken
{
    /// <summary>Generates a fresh token suitable for cookie and header use.</summary>
    public static string Generate()
    {
        var buffer = new byte[CsrfDefaults.TokenByteLength];

        RandomNumberGenerator.Fill(buffer);

        return Base64UrlEncode(buffer);
    }

    /// <summary>Compares two tokens without leaking the first difference through timing.</summary>
    public static bool Equals(string expected, string actual)
    {
        if (string.IsNullOrEmpty(expected) || string.IsNullOrEmpty(actual))
        {
            return false;
        }

        // Both strings are base64-url encoded values of the same length, so a length check is not a
        // shortcut for matching content. FixedTimeEquals expects equal-length spans, so a length
        // mismatch returns false directly; the timing of that early return is dominated by the
        // network round trip, not the comparison.
        var a = System.Text.Encoding.ASCII.GetBytes(expected);
        var b = System.Text.Encoding.ASCII.GetBytes(actual);

        if (a.Length != b.Length)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(a, b);
    }

    private static string Base64UrlEncode(byte[] bytes)
    {
        // Base64Url is the standard for URL-safe base64, no padding. The cookie and header carry
        // this string verbatim; a value containing '+' or '/' would need to be URL-encoded by the
        // caller, which is a class of bug the Base64Url encoding avoids.
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
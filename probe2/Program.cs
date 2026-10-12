using System;
using System.Linq;
using System.Reflection;
using OpenIddict.Abstractions;

var t = typeof(OpenIddictApplicationDescriptor);
Console.WriteLine($"Permissions type: {t.GetProperty("Permissions")?.PropertyType.FullName}");
Console.WriteLine($"Requirements type: {t.GetProperty("Requirements")?.PropertyType.FullName}");

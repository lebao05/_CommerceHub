using System;
using System.Linq;
using System.Reflection;
using OpenIddict.Abstractions;

var asm = typeof(OpenIddict.Abstractions.OpenIddictConstants).Assembly;
var flags = BindingFlags.Public | BindingFlags.Static | BindingFlags.NonPublic;

// Confirm IOpenIddictApplicationManager methods
var app = typeof(IOpenIddictApplicationManager);
Console.WriteLine($"=== {app.Name} methods ===");
foreach (var m in app.GetMethods().OrderBy(x => x.Name))
{
    var pars = string.Join(", ", m.GetParameters().Select(p => p.ParameterType.Name));
    Console.WriteLine($"  {m.Name}({pars}) -> {m.ReturnType.Name}");
}

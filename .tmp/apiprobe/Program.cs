using System.Reflection;

var assembly = Assembly.Load("Duende.IdentityServer.EntityFramework.Storage");

foreach (var type in assembly.GetExportedTypes().OrderBy(t => t.FullName))
{
    Console.WriteLine($"TYPE {type.FullName}");

    foreach (var member in type.GetMembers(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly)
                 .OrderBy(m => m.Name))
    {
        switch (member)
        {
            case PropertyInfo property:
                Console.WriteLine($"  prop  {property.PropertyType.Name} {property.Name} {{ {(property.CanRead ? "get; " : "")}{(property.CanWrite ? "set; " : "")}}}");
                break;
            case MethodInfo method when !method.IsSpecialName:
                Console.WriteLine($"  method {method.ReturnType.Name} {method.Name}({string.Join(", ", method.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}{(p.HasDefaultValue ? " = ..." : "")}"))})");
                break;
            case FieldInfo field:
                Console.WriteLine($"  field  {field.FieldType.Name} {field.Name}{(field.IsLiteral ? " = " + field.GetRawConstantValue() : "")}");
                break;
            case ConstructorInfo constructor:
                Console.WriteLine($"  ctor   ({string.Join(", ", constructor.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}{(p.HasDefaultValue ? " = ..." : "")}"))})");
                break;
        }
    }

    Console.WriteLine();
}

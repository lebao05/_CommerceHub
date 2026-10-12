namespace BuildingBlocks.Core.Domain
{
    public class FilterModel
    {
        public string Field { get; set; } = string.Empty;
        public string Operator { get; set; } = "eq";
        public object? Value { get; set; }

        public FilterModel()
        {
        }

        public FilterModel(string field, string @operator, object? value)
        {
            Field = field;
            Operator = @operator;
            Value = value;
        }
    }
}

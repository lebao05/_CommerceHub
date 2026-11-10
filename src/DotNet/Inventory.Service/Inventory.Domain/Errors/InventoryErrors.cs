using BuildingBlocks.Core.Domain.Shared;

namespace Inventory.Domain.Errors;

/// <summary>
/// The set of failures an Inventory operation can report. Each is a single shared
/// instance so that callers can compare with == and tests can assert on a
/// specific error. Messages are fixed text with no interpolated values.
/// </summary>
public static class InventoryErrors
{
    public static readonly Error NotFound =
        new("Inventory.NotFound", "The requested inventory record was not found.");

    public static readonly Error VariantNotFound =
        new("Inventory.VariantNotFound", "The requested variant was not found.");

    public static readonly Error VariantInactive =
        new("Inventory.VariantInactive", "The variant is deactivated and refuses stock changes.");

    public static readonly Error InsufficientStock =
        new("Inventory.InsufficientStock", "There is not enough available stock for the requested quantity.");

    public static readonly Error InvalidStatusTransition =
        new("Inventory.InvalidStatusTransition", "The requested reservation status transition is not allowed.");

    public static readonly Error DuplicateReservationLine =
        new("Inventory.DuplicateReservationLine", "The reservation already holds this variant.");
}

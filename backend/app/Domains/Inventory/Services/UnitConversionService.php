<?php

namespace App\Domains\Inventory\Services;

use App\Models\MedicineUnitConversion;
use App\Models\Medicine;
use InvalidArgumentException;

class UnitConversionService
{
    /**
     * Convert quantity from a given unit to the medicine's base unit.
     */
    public function convertToBaseUnits(int $medicineId, int $unitId, int $quantity): int
    {
        $medicine = Medicine::findOrFail($medicineId);

        // If the given unit is already the base unit, no conversion needed
        if ((int) $medicine->base_unit_id === (int) $unitId) {
            return $quantity;
        }

        // Find the conversion factor
        $conversion = MedicineUnitConversion::where('medicine_id', $medicineId)
            ->where('from_unit_id', $unitId)
            ->where('to_unit_id', $medicine->base_unit_id)
            ->first();

        if (!$conversion) {
            throw new InvalidArgumentException("No unit conversion defined for medicine ID {$medicineId} from unit ID {$unitId} to base unit ID {$medicine->base_unit_id}.");
        }

        // Base Quantity = quantity * factor
        return (int) round($quantity * $conversion->factor);
    }

    /**
     * Convert base unit price to the packaging unit price.
     */
    public function convertPriceFromBase(int $medicineId, int $unitId, float $basePrice): float
    {
        $medicine = Medicine::findOrFail($medicineId);

        if ((int) $medicine->base_unit_id === (int) $unitId) {
            return $basePrice;
        }

        $conversion = MedicineUnitConversion::where('medicine_id', $medicineId)
            ->where('from_unit_id', $unitId)
            ->where('to_unit_id', $medicine->base_unit_id)
            ->first();

        if (!$conversion) {
            throw new InvalidArgumentException("No unit conversion defined for medicine ID {$medicineId} to unit ID {$unitId}.");
        }

        // Package Price = base price * factor
        return $basePrice * $conversion->factor;
    }
}

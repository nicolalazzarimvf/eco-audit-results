# CRO-674 · Eco Audit Results Page — Data Model

**Test property:** 65 Milcote Road, Birmingham, B29 5NJ  
**UPRN:** 100070452491  
**Sources:** EPC API · Google Solar API · Land Registry SPARQL  
**Date:** 2026-04-23

> This property was chosen because it has verified records in all three APIs:
> EPC (Band D, assessed Oct 2025), Google Solar (HIGH quality imagery), Land Registry (sold £155,000 Nov 2025).

---

## Calculation Assumptions

| Parameter | Value |
|---|---|
| Electricity rate | £0.29 / kWh |
| SEG export rate | £0.15 / kWh |
| Self-use ratio | 35% |
| DC → AC system efficiency | 80% |
| Install cost per kWp | £1,800 |
| ASHP COP | 3.2 |
| Grid CO₂ factor | 0.233 kg / kWh |

---

## EPC API

**Endpoint:** `GET https://api.get-energy-performance-data.communities.gov.uk/api/domestic/search?uprn={uprn}`  
**Then:** `GET /api/certificate?certificate_number={cert}`  
**Auth:** `Authorization: Bearer {token}`

### Identity

| Field | Value |
|---|---|
| epc.uprn | 100070452491 |
| epc.address_line_1 | 65 Milcote Road |
| epc.postcode | B29 5NJ |
| epc.post_town | BIRMINGHAM |
| epc.assessment_type | RdSAP |
| epc.schema_type | RdSAP-Schema-21.0.1 |
| epc.inspection_date | 2025-07-18 |
| epc.completion_date | 2025-10-28 |
| epc.registration_date | 2025-10-28 |
| epc.transaction_type | 1 (marketed sale) |
| epc.tenure | 1 (owner-occupied) |
| epc.status | entered |

### Property Profile

| Field | Value |
|---|---|
| epc.dwelling_type | End-terrace house |
| epc.property_type | 0 (house) |
| epc.built_form | 3 (end-terrace) |
| epc.total_floor_area | 78 m² |
| epc.extensions_count | 1 |
| epc.heated_room_count | 5 |
| epc.habitable_room_count | 5 |
| epc.conservatory_type | 1 (none) |
| epc.has_heated_separate_conservatory | false |
| epc.has_fixed_air_conditioning | false |
| epc.mechanical_ventilation | 0 (none) |
| epc.percent_draughtproofed | 100% |
| epc.door_count | 2 |
| epc.insulated_door_count | 0 |
| epc.draughtproofed_door_count | 2 |

### EPC Scores

| Field | Value |
|---|---|
| epc.current_energy_efficiency_band | D |
| epc.energy_rating_current | 68 / 100 |
| epc.potential_energy_efficiency_band | C |
| epc.energy_rating_potential | 76 / 100 |
| epc.energy_rating_average | 60 / 100 (UK average) |
| epc.environmental_impact_current | 67 / 100 |
| epc.environmental_impact_potential | 72 / 100 |

### Energy Consumption

| Field | Value |
|---|---|
| epc.energy_consumption_current | 209 kWh / m² |
| epc.energy_consumption_potential | 173 kWh / m² |
| epc.co2_emissions_current | 3.0 t / yr |
| epc.co2_emissions_potential | 2.6 t / yr |
| epc.co2_emissions_current_per_floor_area | 38 kg / m² |

### Running Costs

| Field | Current | Potential |
|---|---|---|
| epc.heating_cost | £863 | £756 |
| epc.hot_water_cost | £209 | £209 |
| epc.lighting_cost | £60 | £60 |
| **Total** | **£1,132** | **£1,025** |

### Fabric

| Element | Description | Energy rating | Env rating |
|---|---|---|---|
| epc.walls | Cavity wall, filled cavity | 4 / 5 | 4 / 5 |
| epc.walls_2 | Cavity wall, as built, insulated (assumed) | 4 / 5 | 4 / 5 |
| epc.roof | Pitched, insulated (assumed) | 3 / 5 | 3 / 5 |
| epc.floor | Suspended, no insulation (assumed) | 0 / 5 | 0 / 5 |
| epc.floor_2 | Solid, limited insulation (assumed) | 0 / 5 | 0 / 5 |
| epc.window | Fully double glazed | 2 / 5 | 2 / 5 |
| epc.lighting | Good lighting efficiency | 4 / 5 | 4 / 5 |
| epc.air_tightness | (not tested) | 0 / 5 | 0 / 5 |

### Heating System

| Field | Value |
|---|---|
| epc.main_heating | Boiler and radiators, mains gas |
| epc.main_heating_energy_rating | 4 / 5 |
| epc.main_heating_control | TRVs and bypass |
| epc.main_heating_control_rating | 3 / 5 |
| epc.secondary_heating | None |
| epc.hot_water | From main system |
| epc.hot_water_energy_rating | 4 / 5 |
| epc.has_hot_water_cylinder | false |
| epc.solar_water_heating | false |
| epc.multiple_glazed_proportion | 100% |

### Renewables & Energy Source

| Field | Value |
|---|---|
| epc.solar_pv_percent_roof_area | 0% |
| epc.solar_water_heating | false |
| epc.low_energy_fixed_lighting_bulbs_count | 14 |
| epc.incandescent_fixed_lighting_bulbs_count | 0 |

### Renewable Heat Incentive (heat demand)

| Field | Value |
|---|---|
| epc.rhi_space_heating_kwh | 8,490 kWh / yr |
| epc.rhi_water_heating_kwh | 2,552 kWh / yr |

### Suggested Improvements

| # | Type | Description | Annual saving | Install cost | EPC after |
|---|---|---|---|---|---|
| 1 | W1 | Solar water heating | £58 | £5,000–£10,000 | 70 |
| 2 | G | Draughtproofing | £48 | £220–£250 | 71 |
| 3 | U | Air source heat pump | £209 | £8,000–£10,000 | 76 |

---

## Google Solar API

**Endpoint:** `GET https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude={lat}&location.longitude={lng}&requiredQuality=LOW&key={key}`

### Building

| Field | Value |
|---|---|
| solar.building_id | buildings/ChIJ… |
| solar.center_lat | 52.4341337 |
| solar.center_lng | −1.9717089 |
| solar.imagery_date | 2022-08-19 |
| solar.imagery_quality | HIGH |
| solar.postal_code | B29 5NJ |
| solar.region_code | GB |

### Roof

| Field | Value |
|---|---|
| solar.roof_total_area_m2 | 98.8 m² |
| solar.roof_ground_footprint_m2 | 82.5 m² |
| solar.roof_segments_count | 5 |
| solar.max_sunshine_hours_yr | 972.7 hrs / yr |
| solar.carbon_offset_factor_kg_per_mwh | 479.0 kg / MWh |

### Roof Segments

| Segment | Facing | Azimuth | Pitch | Area | Max sun |
|---|---|---|---|---|---|
| seg0 | NW | 300.4° | 36.1° | 27.9 m² | 958 hrs/yr |
| seg1 | SE ★ | 120.4° | 37.9° | 24.5 m² | 1,017 hrs/yr |
| seg2 | NE | 30.3° | 36.4° | 18.8 m² | 968 hrs/yr |
| seg3 | NW | 302.7° | 22.3° | 16.3 m² | 786 hrs/yr |
| seg4 | SW | 219.5° | 22.3° | 11.4 m² | 905 hrs/yr |

_★ Best segment for solar generation_

### Panel Specs

| Field | Value |
|---|---|
| solar.panel_capacity_w | 400 W |
| solar.panel_height_m | 1.879 m |
| solar.panel_width_m | 1.045 m |
| solar.panel_lifetime_yrs | 20 years |
| solar.max_panels_count | 28 |
| solar.max_array_area_m2 | 55.0 m² |

### All Panel Configs (DC kWh/yr)

| Panels | kWp | DC kWh/yr |
|---|---|---|
| 4 | 1.6 | 1,537 |
| 5 | 2.0 | 1,904 |
| 6 | 2.4 | 2,253 |
| 7 | 2.8 | 2,601 |
| 8 | 3.2 | 2,946 |
| 9 | 3.6 | 3,288 |
| 10 | 4.0 | 3,602 |
| 11 | 4.4 | 3,892 |
| 12 | 4.8 | 4,181 |
| 13 | 5.2 | 4,468 |
| 14 | 5.6 | 4,756 |
| 15 | 6.0 | 5,033 |
| 16 | 6.4 | 5,308 |
| 17 | 6.8 | 5,582 |
| 18 | 7.2 | 5,852 |
| 19 | 7.6 | 6,127 |
| 20 | 8.0 | 6,399 |
| 21 | 8.4 | 6,671 |
| 22 | 8.8 | 6,948 |
| 23 | 9.2 | 7,218 |
| 24 | 9.6 | 7,483 |
| 25 | 10.0 | 7,745 |
| 26 | 10.4 | 8,005 |
| 27 | 10.8 | 8,258 |
| 28 | 11.2 | 8,499 |

---

## Land Registry SPARQL

**Endpoint:** `GET https://landregistry.data.gov.uk/landregistry/query`  
**Auth:** None (public)

### Response Fields

| Field | SPARQL predicate | Example |
|---|---|---|
| lr.price_paid | lrppi:pricePaid | £155,000 |
| lr.transaction_date | lrppi:transactionDate | 2025-11-07 |
| lr.property_type | lrppi:propertyType | terraced |
| lr.estate_type | lrppi:estateType | freehold |
| lr.transaction_category | lrppi:transactionCategory | standardPricePaidTransaction |
| lr.paon | lrcommon:paon | 65 |
| lr.street | lrcommon:street | MILCOTE ROAD |
| lr.postcode | lrcommon:postcode | B29 5NJ |

### This Property — Sale History

| Date | Price | Type | Tenure | Category |
|---|---|---|---|---|
| 2025-11-07 | £155,000 | terraced | freehold | standardPricePaidTransaction |

### Area Comparables — B29 5, terraced freehold, standard sales, 2022+

| Address | Date | Price |
|---|---|---|
| 24 Paganel Road, B29 5TG | 2026-01-27 | £239,000 |
| 24 Marston Road, B29 5NB | 2025-12-05 | £199,000 |
| 429 Alwold Road, B29 5TN | 2025-11-24 | £230,000 |
| 65 Milcote Road, B29 5NJ | 2025-11-07 | £155,000 |
| 65 Milcote Road, B29 5NJ | 2025-11-07 | £155,000 |
| 363 Alwold Road, B29 5TN | 2025-10-31 | £210,000 |
| 67 Swinford Road, B29 5SH | 2025-10-31 | £232,000 |
| 214 Weoley Park Road, B29 5HD | 2025-10-10 | £276,000 |
| 464 Alwold Road, B29 5TW | 2025-10-10 | £200,000 |
| 66 Paganel Road, B29 5TG | 2025-10-01 | £190,000 |
| 186 Gregory Avenue, B29 5DT | 2025-09-15 | £215,000 |
| 126 Harvington Road, B29 5ER | 2025-09-08 | £235,000 |
| 71 Bushwood Road, B29 5AY | 2025-09-01 | £250,000 |
| 41 Gregory Avenue, B29 5DB | 2025-08-29 | £200,000 |
| 56 Hopstone Road, B29 5RD | 2025-07-31 | £225,000 |

| Metric | Value |
|---|---|
| lr.area_comparables_count | 15 |
| lr.area_min_gbp | £147,000 |
| lr.area_max_gbp | £405,000 |
| lr.area_avg_gbp | £272,996 |
| lr.area_median_gbp | £245,000 |

---

## Derived / Calculated

### EPC Summary

| Field | Value |
|---|---|
| derived.total_energy_cost_current_gbp | £1,132 / yr |
| derived.total_energy_cost_potential_gbp | £1,025 / yr |
| derived.total_energy_cost_saving_gbp | £107 / yr |
| derived.co2_saving_t | 0.4 t / yr |
| derived.energy_consumption_saving_kwh_m2 | 36 kWh / m² |
| derived.epc_score_improvement | +8 points (D→C) |
| derived.above_uk_average_by | +8 points |

### Heat Pump Sizing

| Field | Value |
|---|---|
| derived.total_heat_demand_kwh | 11,042 kWh / yr |
| derived.ashp_cop | 3.2 |
| derived.ashp_electricity_needed_kwh | 3,451 kWh / yr |
| derived.ashp_annual_running_cost_gbp | £1,001 / yr |

### Solar Economics — Key System Sizes

| Panels | kWp | DC kWh/yr | AC kWh/yr | Self-use saving | Export earning | Total / yr | Install cost | Payback | CO₂ saved / yr | 20yr net saving |
|---|---|---|---|---|---|---|---|---|---|---|
| 4 | 1.6 | 1,537 | 1,229 | £125 | £120 | £245 | £2,880 | 11.8y | 0.29t | £2,014 |
| 6 | 2.4 | 2,253 | 1,802 | £183 | £176 | £359 | £4,320 | 12.0y | 0.42t | £2,854 |
| 8 | 3.2 | 2,946 | 2,356 | £239 | £230 | £469 | £5,760 | 12.3y | 0.55t | £3,620 |
| 10 | 4.0 | 3,602 | 2,881 | £292 | £281 | £573 | £7,200 | 12.6y | 0.67t | £4,269 |
| 12 | 4.8 | 4,181 | 3,344 | £339 | £326 | £666 | £8,640 | 13.0y | 0.78t | £4,672 |
| 16 | 6.4 | 5,308 | 4,246 | £431 | £414 | £845 | £11,520 | 13.6y | 0.99t | £5,381 |
| 20 | 8.0 | 6,399 | 5,119 | £520 | £499 | £1,019 | £14,400 | 14.1y | 1.19t | £5,974 |
| 28 | 11.2 | 8,499 | 6,799 | £690 | £663 | £1,353 | £20,160 | 14.9y | 1.58t | £6,901 |

### Land Registry Valuation

| Field | Value |
|---|---|
| derived.lr_own_last_sold_date | 2025-11-07 |
| derived.lr_own_last_sold_price_gbp | £155,000 |
| derived.lr_own_sale_count | 1 |
| derived.lr_area_median_gbp | £245,000 |
| derived.lr_area_avg_gbp | £272,996 |
| derived.lr_estimated_value_range | £155,000–£245,000 |

### Total Opportunity Summary

| Opportunity | Annual saving |
|---|---|
| Solar panels (12p, 4.8 kWp) | £666 |
| Air source heat pump | £209 |
| Solar water heating | £58 |
| Draughtproofing | £48 |
| **Total** | **~£981 / yr** |

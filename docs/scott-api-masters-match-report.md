# Scott API (updated collection) vs our masters – 100% match report

## Switch behaviour

When a master is switched to the Scott API, that master is used **fully** from the API: all list, create, read, update, and delete for that entity go to the API. There is no partial use (e.g. some records from Supabase and some from the API). Other masters that are not switched continue to use Supabase only.

---

## Assessment: does the updated Postman collection match our needs 100%?

Assessment is based on **updated-scott-international.postman_collection.json** and our types/services in this repo.

### 1. Colors – **100% match**

| Our need | API (updated collection) |
|----------|---------------------------|
| List (all / paginated) | `GET /api/dashboard/v1/colors?items=10&page=1` |
| Create: name, hex_code, status | Create has `name`, `hex_code`, `status` (active \| inactive) |
| Update: name, hex_code, status | Update has `name`, `hex_code`, `status` |
| Delete | `DELETE .../colors/:id` (correct resource; no wrong URL) |

No missing fields. Full switch is supported.

---

### 2. Profit margins – **100% match**

| Our need | API (updated collection) |
|----------|---------------------------|
| List with status filter | `GET .../profit_margins?items=10&page=1&status=active` |
| Create: name, min_range, max_range, margin_percentage, branding_print, branding_embroidery, status | All present; `status` (active \| deleted) included |
| Update: same fields | All present including `status` |
| Delete | `DELETE .../profit_margins/:id` |

No missing fields. Full switch is supported.

---

### 3. Authorized brands (our “Brands”) – **100% match**

| Our need | API (updated collection) |
|----------|---------------------------|
| List | `GET .../authorized_brands?items=10&page=1` |
| Create: name, description?, logo_url?, status, sort_order? | Create has `name`, `description`, `logo_url`, `status`, `sort_order` |
| Update: same | Update has `name`, `description`, `logo_url`, `status`, `sort_order` |
| Delete | `DELETE .../authorized_brands/:id` |

No missing fields. Full switch is supported.

---

### 4. Asset infos (our “App assets”) – **100% match**

| Our need | API (updated collection) |
|----------|---------------------------|
| List | `GET .../asset_infos?items=10&page=1` |
| Create: name, dx, dy, mirror_dx, asset_height_resp_to_box, asset?, add_on_id?, status | Create has `name`, `dx`, `dy`, `mirror_dx`, `asset_height_resp_to_box`, `asset` (file), `add_on_id`, `status` (snake_case) |
| Update: same | Update has `name`, `dx`, `dy`, `mirror_dx`, `asset_height_resp_to_box`, `add_on_id`, `status` |
| Delete | `DELETE .../asset_infos/:id` |

No missing fields. Full switch is supported.

---

### 5. Customers – **~95% match (one confirmation needed)**

| Our need | API (updated collection) | Match |
|----------|---------------------------|------|
| List with search, status, customer_type, zone_id, pagination | `GET .../customers?search=...&status=active&customer_type=retail&zone_id=&items=10&page=1` | Yes |
| Get by ID | `GET .../customers/:id` | Yes |
| Get by customer_code | `GET .../customers/by_code?customer_code=CUST001` | Yes (we use this) |
| Create: customer_code, company_name, contact_person, email, phone, customer_type, zone_id, status, credit_limit, payment_terms, gst, notes, distributor_ids, brand_ids, addresses (label, type, address, city_id, state_id, postal_code, is_primary) | Create form has all of these | Yes |
| Update: same fields as create (except password optional) | Update example in collection only shows: name, email, password, phone, profile_image, rmp_price_type_id, is_direct_deal, sc_id (many disabled) | **Unclear** |
| update_address / destroy_address | `POST .../customers/:id/update_address`, `.../destroy_address` | Yes |
| Delete | `DELETE .../customers/:id` | Yes |

**Gap:** The **customer update** (PUT) example in the collection does not show our full payload (company_name, contact_person, zone_id, status, credit_limit, payment_terms, gst, notes, brand_ids, distributor_ids, addresses). For a full switch we need the API to accept the same fields on update as on create (or a documented subset). **Action:** Confirm with the API/backend that PUT `/api/v1/customers/:id` accepts at least: company_name, contact_person, zone_id, status, credit_limit, payment_terms, gst, notes, brand_ids, distributor_ids, and address updates. If yes, customers are 100% match.

**Optional / legacy:** We have `price_type_id` (deprecated) and `is_owner_distributor`; API has `rmp_price_type_id`, `is_direct_deal`. Mapping can be done in the adapter if the API does not change.

---

### 6. Promotions – **separate from our PromotionalBanners/PromotionalAssets**

API promotions: name, upload_date, link, category, thumbnail, file_size (catalogue-style). Our promotional masters: title, banner_image, category_id, brand_id, class_id. These are different concepts. If you do **not** plan to replace PromotionalBanners/PromotionalAssets with API promotions, no change needed. If you do, a separate mapping design is needed.

---

## Summary

| Master | Full switch possible with updated collection? | Note |
|--------|-----------------------------------------------|------|
| Colors | Yes | 100% |
| Profit margins | Yes | 100% |
| Authorized brands (Brands) | Yes | 100% |
| Asset infos (App assets) | Yes | 100% |
| Customers | Yes, after confirmation | Confirm that customer **update** accepts same fields as create (see above). |

So: for **Colors, Profit margins, Authorized brands, and Asset infos**, the updated collection matches our needs 100% for a full switch. For **Customers**, it matches except we need confirmation that the update endpoint accepts the full set of fields we send (company_name, contact_person, zone_id, status, credit_limit, payment_terms, gst, notes, brand_ids, distributor_ids, addresses). Once that is confirmed, the updated collection matches our needs 100% for these masters.

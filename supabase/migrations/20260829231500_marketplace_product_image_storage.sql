begin;

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'marketplace-product-images',
    'marketplace-product-images',
    true,
    8388608,
    array[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
)
on conflict (id)
do update
set
    public = true,
    file_size_limit = 8388608,
    allowed_mime_types = excluded.allowed_mime_types;


drop policy if exists marketplace_product_images_storage_select
on storage.objects;

create policy marketplace_product_images_storage_select
on storage.objects
for select
to authenticated
using (
    bucket_id = 'marketplace-product-images'
    and
    (storage.foldername(name))[1] = auth.uid()::text
);


drop policy if exists marketplace_product_images_storage_insert
on storage.objects;

create policy marketplace_product_images_storage_insert
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'marketplace-product-images'
    and
    (storage.foldername(name))[1] = auth.uid()::text
);


drop policy if exists marketplace_product_images_storage_update
on storage.objects;

create policy marketplace_product_images_storage_update
on storage.objects
for update
to authenticated
using (
    bucket_id = 'marketplace-product-images'
    and
    (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'marketplace-product-images'
    and
    (storage.foldername(name))[1] = auth.uid()::text
);


drop policy if exists marketplace_product_images_storage_delete
on storage.objects;

create policy marketplace_product_images_storage_delete
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'marketplace-product-images'
    and
    (storage.foldername(name))[1] = auth.uid()::text
);

commit;
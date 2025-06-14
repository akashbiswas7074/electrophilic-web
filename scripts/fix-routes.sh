#!/bin/bash

# Create the destination directory if it doesn't exist
mkdir -p /home/akashbiswas7797/Desktop/co-pal-ecom/Electrophilic/electrophilic-web/app/(shop)/shop/category/[slug]/[subslug]

# Move the subcategory page to use consistent naming
if [ -f "/home/akashbiswas7797/Desktop/co-pal-ecom/Electrophilic/electrophilic-web/app/shop/category/[categorySlug]/[subcategorySlug]/page.tsx" ]; then
  mv /home/akashbiswas7797/Desktop/co-pal-ecom/Electrophilic/electrophilic-web/app/shop/category/[categorySlug]/[subcategorySlug]/page.tsx \
     /home/akashbiswas7797/Desktop/co-pal-ecom/Electrophilic/electrophilic-web/app/(shop)/shop/category/[slug]/[subslug]/page.tsx
  echo "Moved subcategory page to app/(shop)/shop/category/[slug]/[subslug]/page.tsx"
fi

# Remove conflicting files
rm -f /home/akashbiswas7797/Desktop/co-pal-ecom/Electrophilic/electrophilic-web/app/(shop)/shop/category/[categorySlug]/page.tsx
rm -f /home/akashbiswas7797/Desktop/co-pal-ecom/Electrophilic/electrophilic-web/app/shop/category/[categorySlug]/page.tsx

echo "Removed conflicting category pages"
echo "Route conflict should be resolved now"

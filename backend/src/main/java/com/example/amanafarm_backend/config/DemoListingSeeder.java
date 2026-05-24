package com.example.amanafarm_backend.config;

import com.example.amanafarm_backend.model.Animal;
import com.example.amanafarm_backend.model.AnimalImage;
import com.example.amanafarm_backend.model.Product;
import com.example.amanafarm_backend.repository.AnimalRepository;
import com.example.amanafarm_backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DemoListingSeeder implements CommandLineRunner {

    private final AnimalRepository animalRepository;
    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        seedAnimals();
        seedProducts();
    }

    private void seedAnimals() {
        List<AnimalSeed> animals = List.of(
                new AnimalSeed(
                        "خروف سيدي للتربية",
                        "أغنام",
                        "صفاقس",
                        "عقارب",
                        "8 أشهر",
                        "ذكر",
                        "ممتازة",
                        1350,
                        "خروف سيدي تونسي بصحة جيدة، مناسب للتربية والمناسبات، ويمكن المعاينة قبل الاتفاق.",
                        true,
                        true,
                        List.of(
                                "https://images.unsplash.com/photo-1484557985045-edf25e08da73?w=1100&q=85",
                                "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1100&q=85"
                        )
                ),
                new AnimalSeed(
                        "عجلة حلوب صغيرة",
                        "أبقار",
                        "باجة",
                        "تستور",
                        "سنة ونصف",
                        "أنثى",
                        "ممتازة",
                        4800,
                        "عجلة حلوب من تربية محلية، متابعة بيطرية وتغذية طبيعية، جاهزة للمعاينة.",
                        true,
                        true,
                        List.of(
                                "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=1100&q=85",
                                "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1100&q=85"
                        )
                ),
                new AnimalSeed(
                        "ماعز شامية حلوبة",
                        "ماعز",
                        "نابل",
                        "قرمبالية",
                        "سنة",
                        "أنثى",
                        "ممتازة",
                        980,
                        "ماعز شامية حلوبة، نشيطة ومناسبة للتربية، والسعر قابل للنقاش بعد المعاينة.",
                        true,
                        false,
                        List.of(
                                "https://images.unsplash.com/photo-1524024973431-2ad916746881?w=1100&q=85",
                                "https://images.unsplash.com/photo-1533318087102-b47f6e338eb1?w=1100&q=85"
                        )
                ),
                new AnimalSeed(
                        "دجاج بلدي بياض",
                        "دواجن",
                        "أريانة",
                        "سكرة",
                        "6 أشهر",
                        "أنثى",
                        "ممتازة",
                        28,
                        "دجاج بلدي بياض من تربية نظيفة، البيع بالراس أو بالجملة حسب الكمية.",
                        false,
                        false,
                        List.of(
                                "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=1100&q=85",
                                "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=1100&q=85"
                        )
                ),
                new AnimalSeed(
                        "ناقة حلوب من تطاوين",
                        "جمال",
                        "تطاوين",
                        "رمادة",
                        "5 سنوات",
                        "أنثى",
                        "ممتازة",
                        6500,
                        "ناقة حلوب بصحة ممتازة من الجنوب التونسي، متاحة للمعاينة والتفاوض الجدي.",
                        true,
                        true,
                        List.of(
                                "https://images.unsplash.com/photo-1489161587020-79aa193f04ff?w=1100&q=85",
                                "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1100&q=85"
                        )
                ),
                new AnimalSeed(
                        "أرانب بلدية للتربية",
                        "أرانب",
                        "سوسة",
                        "مساكن",
                        "3 أشهر",
                        "ذكر",
                        "جيدة",
                        35,
                        "أرانب بلدية نشيطة، مناسبة للتربية المنزلية أو مشروع صغير.",
                        false,
                        false,
                        List.of(
                                "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1100&q=85"
                        )
                )
        );

        animals.forEach(seed -> {
            Animal animal = animalRepository.findByTitle(seed.title()).orElseGet(Animal::new);
            animal.setTitle(seed.title());
            animal.setDescription(seed.description());
            animal.setCategory(seed.category());
            animal.setPrice(BigDecimal.valueOf(seed.price()));
            animal.setPriceType("NEGOTIABLE");
            animal.setWilaya(seed.wilaya());
            animal.setZone(seed.zone());
            animal.setAge(seed.age());
            animal.setGender(seed.gender());
            animal.setHealthStatus(seed.healthStatus());
            animal.setPhone("+21655123456");
            animal.setContactMethod("WHATSAPP");
            animal.setDeliveryAvailable(seed.deliveryAvailable());
            animal.setVetCertificate(seed.vetCertificate());
            animal.setFeatured(true);
            animal.setTrustedSeller(true);
            animal.setStatus("ACTIVE");
            animal.setUserId(1L);
            animal.getImages().clear();
            for (int i = 0; i < seed.images().size(); i++) {
                animal.getImages().add(AnimalImage.builder()
                        .animal(animal)
                        .imageUrl(seed.images().get(i))
                        .isMain(i == 0)
                        .build());
            }
            animalRepository.save(animal);
        });
    }

    private void seedProducts() {
        List<ProductSeed> products = List.of(
                new ProductSeed(
                        "زيت زيتون بكر ممتاز",
                        "زيتون",
                        "سيدي بوزيد",
                        "معصرة محلية",
                        "لتر",
                        "20 لتر",
                        24,
                        "زيت زيتون تونسي بكر ممتاز من موسم جديد، مناسب للعائلات والمطاعم.",
                        "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1100&q=85"
                ),
                new ProductSeed(
                        "تمور دقلة نور",
                        "تمور",
                        "قبلي",
                        "واحات قبلي",
                        "كغ",
                        "50 كغ",
                        14,
                        "تمور دقلة نور تونسية، جودة ممتازة وفرز نظيف، متاحة بالكيلو أو بالجملة.",
                        "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=1100&q=85"
                ),
                new ProductSeed(
                        "علف أغنام مركز",
                        "أعلاف",
                        "القيروان",
                        "مورد فلاحي",
                        "كيس",
                        "40 كيس",
                        42,
                        "علف مركز للأغنام والماعز، تركيبة متوازنة وتوصيل حسب الكمية.",
                        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1100&q=85"
                ),
                new ProductSeed(
                        "طماطم موسمية من نابل",
                        "خضر",
                        "نابل",
                        "ضيعة محلية",
                        "كغ",
                        "300 كغ",
                        2.8,
                        "طماطم موسمية طازجة من ضيعة في نابل، متوفرة يوميا حسب الطلب.",
                        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1100&q=85"
                ),
                new ProductSeed(
                        "بطاطا موسمية من جندوبة",
                        "خضر",
                        "جندوبة",
                        "فرمة محلية",
                        "كغ",
                        "500 كغ",
                        2.2,
                        "بطاطا تونسية نظيفة ومفرزة، مناسبة للبيع بالجملة أو للمطاعم.",
                        "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=1100&q=85"
                ),
                new ProductSeed(
                        "سماد عضوي تونسي",
                        "أسمدة",
                        "صفاقس",
                        "شركة محلية",
                        "كيس",
                        "60 كيس",
                        95,
                        "سماد عضوي مناسب للخضر والأشجار المثمرة، جودة مضمونة ومتاح للتوصيل.",
                        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1100&q=85"
                ),
                new ProductSeed(
                        "فلفل حار تونسي",
                        "خضر",
                        "القيروان",
                        "منتج محلي",
                        "كغ",
                        "120 كغ",
                        5.5,
                        "فلفل حار تونسي طازج، مناسب للمطاعم والتجار، البيع حسب الكمية.",
                        "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=1100&q=85"
                )
        );

        products.forEach(seed -> {
            Product product = productRepository.findByTitle(seed.title()).orElseGet(Product::new);
            product.setTitle(seed.title());
            product.setCategory(seed.category());
            product.setDescription(seed.description());
            product.setPrice(seed.price());
            product.setPriceType("NEGOTIABLE");
            product.setUnit(seed.unit());
            product.setQuantity(seed.quantity());
            product.setOrigin(seed.origin());
            product.setLocation(seed.wilaya());
            product.setWilaya(seed.wilaya());
            product.setImageUrl(seed.imageUrl());
            product.setContactPhone("+21655123456");
            product.setInStock(true);
            product.setFeatured(true);
            product.setDeliveryAvailable(true);
            product.setCertified(true);
            product.setSellerType("فلاح تونسي");
            product.setCompanyName("AMANAFARM");
            product.setCompanyTagline("مورد موثوق في السوق الفلاحي");
            product.setCompanyVerified(true);
            product.setSellerName("أحمد بن سالم");
            product.setSellerVerified(true);
            product.setSellerRating("4.8");
            product.setUserId(1L);
            productRepository.save(product);
        });
    }

    private record AnimalSeed(
            String title,
            String category,
            String wilaya,
            String zone,
            String age,
            String gender,
            String healthStatus,
            double price,
            String description,
            boolean deliveryAvailable,
            boolean vetCertificate,
            List<String> images
    ) {
    }

    private record ProductSeed(
            String title,
            String category,
            String wilaya,
            String origin,
            String unit,
            String quantity,
            double price,
            String description,
            String imageUrl
    ) {
    }
}

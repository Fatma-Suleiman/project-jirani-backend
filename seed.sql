USE my_jirani;

mysql> INSERT INTO service_providers (category, name, phone_number, image, price, rating, lat, lon) VALUES
    -> ('plumbing', 'Jua Kali Plumbing', '+254700123456', '/images/plumber1.jpg', 'Starting from ksh.600', 4.5, -1.3081, 36.8911), -- Kayole
    -> ('plumbing', 'Anthony Kamau Plumbing', '+254711234567', '/images/plumber2.jpg', 'Starting from ksh.400', 4.2, -1.2861, 36.8267), -- CBD
    -> ('plumbing', 'Mwangi’s Plumbing', '+254722345678', '/images/plumber3.jpg', 'Starting from ksh.550', 4.8, -1.2895, 36.8389), -- Landimawe
    -> ('plumbing', 'Omondi Pipe Fixers', '+254733456789', '/images/plumber4.jpg', 'Starting from ksh.450', 4.4, -1.2852, 36.8511), -- Eastleigh
    -> ('plumbing', 'Wanjiku Plumbing', '+254744567890', '/images/plumber5.jpg', 'Starting from ksh.400', 4.0, -1.2645, 36.8542), -- Huruma
    -> ('plumbing', 'Kiptoo Plumbing', '+254755678901', '/images/plumber6.jpg', 'Starting from ksh.250', 4.7, -1.2925, 36.9115); -- Utawala
Query OK, 6 rows affected (0.03 sec)
Records: 6  Duplicates: 0  Warnings: 0

 -- Cleaning Services
mysql> INSERT INTO service_providers (category, name, phone_number, description, image, price, rating, lat, lon)
    -> VALUES
    -> ('cleaning', 'Sparkle Cleaning Services', '+254700123111', 'Professional home and office cleaning.', '/images/clean1.jpg', 'Starting from ksh.500', 4.5, -1.2921, 36.8219), -- Westlands
    -> ('cleaning', 'Mama Safi Cleaners', '+254711234222', 'Affordable deep cleaning for all spaces.', '/images/clean2.jpg', 'Starting from ksh.400', 4.3, -1.3005, 36.8242), -- Dagoretti
    -> ('cleaning', 'Bright Touch Cleaners', '+254722345333', 'Eco-friendly cleaning solutions.', '/images/clean3.jpg', 'Starting from ksh.450', 4.7, -1.2833, 36.8172), -- Kibera
    -> ('cleaning', 'Shine Pro Cleaners', '+254733456444', 'Fast and reliable cleaning services.', '/images/clean4.jpg', 'Starting from ksh.600', 4.6, -1.2901, 36.8310), -- Embakasi
    -> ('cleaning', 'Quick Clean Nairobi', '+254744567555', 'Emergency and scheduled cleaning.', '/images/clean5.jpg', 'Starting from ksh.500', 4.4, -1.3055, 36.8295), -- Embakasi East
    -> ('cleaning', 'Elite Cleaners', '+254755678666', 'Professional carpet and furniture cleaning.', '/images/clean6.jpg', 'Starting from ksh.450', 4.7, -1.3072, 36.8271); -- Kasarani
Query OK, 6 rows affected (0.03 sec)
Records: 6  Duplicates: 0  Warnings: 0

mysql>
mysql> -- Electrical Work
mysql> INSERT INTO service_providers (category, name, phone_number, description, image, price, rating, lat, lon)
    -> VALUES
    -> ('electrical', 'Elite Electrical Services', '+254701111111', 'Electrical installation and repairs.', '/images/electric1.jpg', 'Starting from ksh.700', 4.6, -1.3102, 36.8210), -- Landimawe
    -> ('electrical', 'PowerFix Electricians', '+254702222222', 'Emergency electrical repairs.', '/images/electric2.jpg', 'Starting from ksh.800', 4.5, -1.2885, 36.8257), -- Roysambu
    -> ('electrical', 'Smart Wiring Solutions', '+254703333333', 'Smart home electrical wiring.', '/images/electric3.jpg', 'Starting from ksh.1000', 4.8, -1.2935, 36.8243), -- Pumwani
    -> ('electrical', 'Junction Electricians', '+254704444444', 'Quick electrical fixes.', '/images/electric4.jpg', 'Starting from ksh.750', 4.4, -1.2965, 36.8280), -- Langata
    -> ('electrical', 'Mega Volt Pros', '+254705555555', 'Home and office electrical installations.', '/images/electric5.jpg', 'Starting from ksh.850', 4.7, -1.3115, 36.8195), -- Njiru
    -> ('electrical', 'Ampere Electric Co.', '+254706666666', 'Reliable electric wiring.', '/images/electric6.jpg', 'Starting from ksh.900', 4.5, -1.3140, 36.8235); -- Starehe
Query OK, 6 rows affected (0.01 sec)
Records: 6  Duplicates: 0  Warnings: 0

mysql>
mysql> -- Carpentry
mysql> INSERT INTO service_providers (category, name, phone_number, description, image, price, rating, lat, lon)
    -> VALUES
    -> ('carpentry', 'Crafted Woodworks', '+254707777777', 'Custom furniture and woodwork.', '/images/carpenter1.jpg', 'Starting from ksh.1200', 4.6, -1.2854, 36.8123), -- Kayole
    -> ('carpentry', 'Timber Masters', '+254708888888', 'Expert carpentry services.', '/images/carpenter2.jpg', 'Starting from ksh.1100', 4.5, -1.2975, 36.8205), -- Mathare
    -> ('carpentry', 'Urban Carpenters', '+254709999999', 'Modern woodwork designs.', '/images/carpenter3.jpg', 'Starting from ksh.950', 4.7, -1.2990, 36.8310), -- Dagoretti
    -> ('carpentry', 'Elite Woodworks', '+254701000000', 'Custom cabinetry and shelves.', '/images/carpenter4.jpg', 'Starting from ksh.1300', 4.8, -1.2885, 36.8295), -- Thika
    -> ('carpentry', 'Budget Carpentry', '+254702000000', 'Affordable wood repair.', '/images/carpenter5.jpg', 'Starting from ksh.800', 4.4, -1.2832, 36.8287), -- Roysambu
    -> ('carpentry', 'Handy Craftsmen', '+254703000000', 'Quick and reliable carpentry.', '/images/carpenter6.jpg', 'Starting from ksh.900', 4.5, -1.2915, 36.8250); -- Embakasi
Query OK, 6 rows affected (0.01 sec)
Records: 6  Duplicates: 0  Warnings: 0

mysql>
mysql> -- Tutoring
mysql> INSERT INTO service_providers (category, name, phone_number, description, image, price, rating, lat, lon)
    -> VALUES
    -> ('tutoring', 'Math Masters', '+254711111111', 'Experienced math tutors.', '/images/tutor1.jpg', 'Starting from ksh.500/hr', 4.6, -1.2900, 36.8275), -- Njiru
    -> ('tutoring', 'English Pros', '+254712222222', 'Professional English tutors.', '/images/tutor2.jpg', 'Starting from ksh.600/hr', 4.5, -1.2875, 36.8240), -- Ruaraka
    -> ('tutoring', 'Science Gurus', '+254713333333', 'Chemistry and physics experts.', '/images/tutor3.jpg', 'Starting from ksh.700/hr', 4.7, -1.2835, 36.8260), -- Embakasi
    -> ('tutoring', 'Homework Help', '+254714444444', 'Homework assistance for kids.', '/images/tutor4.jpg', 'Starting from ksh.400/hr', 4.3, -1.2985, 36.8245), -- Starehe
    -> ('tutoring', 'Exam Prep Experts', '+254715555555', 'Helping students ace exams.', '/images/tutor5.jpg', 'Starting from ksh.550/hr', 4.4, -1.3060, 36.8260), -- Kibera
    -> ('tutoring', 'Language Coaches', '+254716666666', 'French, German, and Spanish.', '/images/tutor6.jpg', 'Starting from ksh.650/hr', 4.6, -1.2995, 36.8250); -- Westlands
Query OK, 6 rows affected (0.01 sec)
Records: 6  Duplicates: 0  Warnings: 0

mysql>
mysql> -- Daycare
mysql> INSERT INTO service_providers (category, name, phone_number, description, image, price, rating, lat, lon)
    -> VALUES
    -> ('daycare', 'Little Angels Daycare', '+254700111111', 'Safe and nurturing environment.', '/images/daycare1.jpg', 'Starting from ksh.300/day', 4.7, -1.2955, 36.8265), -- Kibera
    -> ('daycare', 'Happy Tots', '+254700222222', 'Loving daycare for toddlers.', '/images/daycare2.jpg', 'Starting from ksh.250/day', 4.5, -1.2995, 36.8275), -- Westlands
    -> ('daycare', 'Mama Njeri’s Daycare', '+254700333333', 'Affordable daycare.', '/images/daycare3.jpg', 'Starting from ksh.280/day', 4.6, -1.2985, 36.8250); -- Dagoretti
Query OK, 3 rows affected (0.01 sec)
Records: 3  Duplicates: 0  Warnings: 0

mysql> USE my_jirani;
Database changed
mysql>
mysql> -- Photography & Videography
mysql> INSERT INTO service_providers (category, name, phone_number, description, image, price, rating, lat, lon)
    -> VALUES
    -> ('photography', 'Shutter Kings', '+254701111111', 'Professional event photography.', '/images/photo1.jpg', 'Starting from ksh.800/event', 4.6, -1.2950, 36.8270), -- Westlands
    -> ('photography', 'Kamera Masters', '+254701222222', 'Top-notch wedding photography.', '/images/photo2.jpg', 'Starting from ksh.900/event', 4.8, -1.2935, 36.8255), -- Dagoretti
    -> ('photography', 'Focus Lens Studios', '+254701333333', 'Creative photography and editing.', '/images/photo3.jpg', 'Starting from ksh.600/event', 4.5, -1.2910, 36.8235), -- Kasarani
    -> ('photography', 'Sharp Focus Media', '+254701444444', 'Event and product photography.', '/images/photo4.jpg', 'Starting from ksh.750/event', 4.7, -1.2885, 36.8245), -- Embakasi
    -> ('photography', 'Pro Shoot Agency', '+254701555555', 'Professional studio and outdoor shoots.', '/images/photo5.jpg', 'Starting from ksh.1000/event', 4.6, -1.2965, 36.8290), -- Kilimani
    -> ('photography', 'Wedding Snapshots', '+254701666666', 'Exclusive wedding photography.', '/images/photo6.jpg', 'Starting from ksh.1500/event', 4.8, -1.2870, 36.8260); -- Central
Query OK, 6 rows affected (0.01 sec)
Records: 6  Duplicates: 0  Warnings: 0

mysql>
mysql> -- Event Planning
mysql> INSERT INTO service_providers (category, name, phone_number, description, image, price, rating, lat, lon)
    -> VALUES
    -> ('event', 'Chama Affairs', '+254703111111', 'Expert in party and chama events.', '/images/event1.jpg', 'Starting from ksh.1500', 4.6, -1.2980, 36.8270), -- Embakasi
    -> ('event', 'Afro Weddings', '+254703222222', 'Traditional and modern wedding planning.', '/images/event2.jpg', 'Starting from ksh.5000', 4.7, -1.2920, 36.8250), -- Westlands
    -> ('event', 'Corporate Planners', '+254703333333', 'Organizing business events and conferences.', '/images/event3.jpg', 'Starting from ksh.7000', 4.5, -1.2905, 36.8235), -- Ruaraka
    -> ('event', 'Luxury Events', '+254703444444', 'Premium and exclusive events.', '/images/event4.jpg', 'Starting from ksh.15000', 4.8, -1.2855, 36.8210), -- Roysambu
    -> ('event', 'Budget Event Pros', '+254703555555', 'Affordable event planning.', '/images/event5.jpg', 'Starting from ksh.12000', 4.4, -1.2990, 36.8285), -- Langata
    -> ('event', 'QuickFix Events', '+254703666666', 'Last-minute event solutions.', '/images/event6.jpg', 'Starting from ksh.1800', 4.3, -1.2875, 36.8255); -- Kibera
Query OK, 6 rows affected (0.01 sec)
Records: 6  Duplicates: 0  Warnings: 0

mysql>
mysql> -- Beauty & Hair Services
mysql> INSERT INTO service_providers (category, name, phone_number, description, image, price, rating, lat, lon)
    -> VALUES
    -> ('beauty', 'Salon Deluxe', '+254705111111', 'Premium salon services.', '/images/beauty1.jpg', 'Starting from ksh.500', 4.6, -1.2930, 36.8260), -- Pumwani
    -> ('beauty', 'Mama Wanja Beauty Parlour', '+254705222222', 'Hair and beauty styling.', '/images/beauty2.jpg', 'Starting from ksh.400', 4.4, -1.2965, 36.8275), -- Starehe
    -> ('beauty', 'Glow and Go Salon', '+254705333333', 'Express styling and makeup.', '/images/beauty3.jpg', 'Starting from ksh.450', 4.7, -1.2895, 36.8255), -- Kilimani
    -> ('beauty', 'Hair Hub', '+254705444444', 'Braids, weaves, and styling.', '/images/beauty4.jpg', 'Starting from ksh.600', 4.5, -1.2925, 36.8240), -- Mathare
    -> ('beauty', 'Elite Spa & Salon', '+254705555555', 'Full spa and salon experience.', '/images/beauty5.jpg', 'Starting from ksh.1000', 4.8, -1.2860, 36.8220), -- Central
    -> ('beauty', 'Bliss Hair Studio', '+254705666666', 'Creative and trendy styles.', '/images/beauty6.jpg', 'Starting from ksh.750', 4.6, -1.2970, 36.8290); -- Embakasi East
Query OK, 6 rows affected (0.01 sec)
Records: 6  Duplicates: 0  Warnings: 0

mysql>
mysql> -- Tech Support & IT Services
mysql> INSERT INTO service_providers (category, name, phone_number, description, image, price, rating, lat, lon)
    -> VALUES
    -> ('tech', 'Tech Fix Nairobi', '+254706111111', 'Software installation and repairs.', '/images/tech1.jpg', 'Starting from ksh.1500', 4.5, -1.2920, 36.8210), -- Kilimani
    -> ('tech', 'IT Solutions Hub', '+254706222222', 'Hardware and software services.', '/images/tech2.jpg', 'Starting from ksh.2000', 4.6, -1.2945, 36.8255), -- Ruaraka
    -> ('tech', 'Gadget Repair Pros', '+254706333333', 'Mobile and laptop repairs.', '/images/tech3.jpg', 'Starting from ksh.1800', 4.7, -1.2995, 36.8295), -- Njiru
    -> ('tech', 'Computer Works', '+254706444444', 'Office IT setup.', '/images/tech4.jpg', 'Starting from ksh.2500', 4.6, -1.2965, 36.8245), -- Roysambu
    -> ('tech', 'Phone Fix Centre', '+254706555555', 'Smartphone and tablet repairs.', '/images/tech5.jpg', 'Starting from ksh.1200', 4.4, -1.2885, 36.8235), -- Kibera
    -> ('tech', 'Smart IT Nairobi', '+254706666666', 'Smart home and automation.', '/images/tech6.jpg', 'Starting from ksh.3000', 4.8, -1.2910, 36.8250); -- Pumwani
Query OK, 6 rows affected (0.01 sec)
Records: 6  Duplicates: 0  Warnings: 0

mysql>

/*
SHOW DATABASES;
USE my_jirani;
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM service_providers;
SELECT * FROM bookings; -----users that have booked
SHOW COLUMNS FROM bookings; ----the date, time, booking history

*/


/*more prompts:
mysql> ALTER TABLE bookings
    ->   ADD CONSTRAINT fk_bookings_user
    ->     FOREIGN KEY (user_id) REFERENCES users(id)
    ->     ON DELETE SET NULL,
    ->   ADD CONSTRAINT fk_bookings_service
    ->     FOREIGN KEY (service_id) REFERENCES service_providers(id)
    ->     ON DELETE CASCADE,
    ->   ADD INDEX idx_bookings_user  (user_id),
    ->   ADD INDEX idx_bookings_svc   (service_id);
Query OK, 10 rows affected (0.32 sec)
Records: 10  Duplicates: 0  Warnings: 0

mysql>
*/

/* service providers
-- 1) Add the new column (nullable at first, so you don’t break existing rows)
ALTER TABLE service_providers
  ADD COLUMN user_id INT NULL;

-- 2) (Later) back-fill user_id for any pre-seeded providers, if you have corresponding users:
--    UPDATE service_providers SET user_id = 123 WHERE id = 55;
--    …repeat for each…

-- 3) Once you’ve assigned user_ids, make the column required and add the foreign key
ALTER TABLE service_providers
  MODIFY COLUMN user_id INT NOT NULL,
  ADD CONSTRAINT fk_provider_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;
*/

/*SHOW COLUMNS FROM service_providers LIKE 'user_id'; 

SELECT user_id FROM service_providers WHERE id = 113;


*/







































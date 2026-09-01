/** Bangladesh districts and their thanas/upazilas, for the checkout address picker.
 *
 * Checkout used to ask for a free-text "City", "District" and "Postal code",
 * which produced addresses a courier can't route ("dhaka", "Dhak", blank) and
 * asked the customer for a postcode almost nobody knows. This replaces all three
 * with two dependent dropdowns: pick a district, then a thana inside it.
 *
 * Sources — this data is copied from public datasets, never recalled:
 *  · 64 districts, 8 divisions and 494 upazilas: the `bd-geodata` package
 *    (MIT), itself derived from the bangladesh.gov.bd district portals.
 *  · The thanas of all EIGHT metropolitan police forces, each from that force's
 *    Wikipedia article: Dhaka (50), Chattogram (16), Rajshahi (12), Khulna (8),
 *    Gazipur (7), Sylhet (6), Rangpur (6), Barisal (4).
 *
 * Why the metro merge is load-bearing, not padding: a city that has its own
 * metropolitan police is NOT divided into upazilas, so it appears in no upazila
 * dataset at all. Dhaka district officially contains five upazilas (Savar,
 * Dhamrai, Keraniganj, Nawabganj, Dohar) and Dhanmondi, Gulshan, Mirpur and
 * Uttara are in none of them. Khulna and Rajshahi were worse: on upazilas alone
 * they had no entry for their own city whatsoever, so a customer in either —
 * the 3rd and 4th largest cities in the country — could not select where they
 * live. Only Dhaka and Chattogram were merged originally, on the mistaken
 * assumption that every other district's city was covered by a "Sadar" upazila.
 * It isn't; hence all eight.
 *
 * Barisal's four proposed-but-not-yet-operational stations are excluded — this
 * list offers only places that exist.
 *
 * Where a metro thana duplicates an upazila of the same name (Karnaphuli, Paba),
 * the two collapse to one entry — a street address disambiguates them, and two
 * near-identical rows in a dropdown only confuse.
 *
 * `aka` carries the pre-2018 government spellings so a customer typing
 * "Chittagong" or "Jessore" still finds their district. The two Sadar upazilas
 * that still carried the old district spelling ("Bogra Sadar", "Jessore Sadar")
 * were renamed to match, since a customer who picked "Bogura" then searched
 * "Bogura" in the thana box found nothing.
 *
 * Coverage note: this is the country's real administrative geography, which is
 * what a courier's own coverage is built on — Steadfast publishes no public
 * area list or API to map against, so parity is achieved by covering every
 * upazila and every metropolitan thana rather than by mirroring their table.
 *
 * Bundle note: only the checkout and account routes import this (~11 KB raw,
 * ~4 KB gzipped), and both are lazy — it never reaches the storefront bundle.
 */
export const BD_DISTRICTS = [
  { name: "Bagerhat", division: "Khulna", thanas: ["Bagerhat Sadar","Chitalmari","Fakirhat","Kachua","Mollahat","Mongla","Morrelganj","Rampal","Sarankhola"] },
  { name: "Bandarban", division: "Chattogram", thanas: ["Alikadam","Bandarban Sadar","Lama","Naikhongchhari","Rowangchhari","Ruma","Thanchi"] },
  { name: "Barguna", division: "Barisal", thanas: ["Amtali","Bamna","Barguna Sadar","Betagi","Pathorghata","Taltali"] },
  { name: "Barisal", division: "Barisal", aka: ["Barishal"], thanas: ["Agailjhara","Airport","Babuganj","Bakerganj","Banaripara","Bandar","Barisal Sadar","Gournadi","Hizla","Kawnia","Kotwali Model","Mehendiganj","Muladi","Wazirpur"] },
  { name: "Bhola", division: "Barisal", thanas: ["Bhola Sadar","Borhan Sddin","Charfesson","Doulatkhan","Lalmohan","Monpura","Tazumuddin"] },
  { name: "Bogura", division: "Rajshahi", aka: ["Bogra"], thanas: ["Adamdighi","Bogura Sadar","Dhunot","Dupchanchia","Gabtali","Kahaloo","Nondigram","Shajahanpur","Shariakandi","Sherpur","Shibganj","Sonatala"] },
  { name: "Brahmanbaria", division: "Chattogram", thanas: ["Akhaura","Ashuganj","Bancharampur","Bijoynagar","Brahmanbaria Sadar","Kasba","Nabinagar","Nasirnagar","Sarail"] },
  { name: "Chandpur", division: "Chattogram", thanas: ["Chandpur Sadar","Faridgonj","Haimchar","Hajiganj","Kachua","Matlab North","Matlab South","Shahrasti"] },
  { name: "Chapainawabganj", division: "Rajshahi", thanas: ["Bholahat","Chapainawabganj Sadar","Gomostapur","Nachol","Shibganj"] },
  { name: "Chattogram", division: "Chattogram", aka: ["Chittagong"], thanas: ["Akbarshah","Anwara","Bakoliya","Bandar","Banshkhali","Bayazid","Boalkhali","Chandanaish","Chandgaon","Chawkbazar","Double Mooring","EPZ","Fatikchhari","Halishahar","Hathazari","Karnaphuli","Khulshi","Kotwali","Lohagara","Mirsharai","Pahartali","Panchlaish","Patenga","Patiya","Rangunia","Raozan","Sadarghat","Sandwip","Satkania","Sitakunda"] },
  { name: "Chuadanga", division: "Khulna", thanas: ["Alamdanga","Chuadanga Sadar","Damurhuda","Jibannagar"] },
  { name: "Comilla", division: "Chattogram", aka: ["Cumilla"], thanas: ["Barura","Brahmanpara","Burichang","Chandina","Chauddagram","Comilla Sadar","Daudkandi","Debidwar","Homna","Laksam","Lalmai","Meghna","Monohargonj","Muradnagar","Nangalkot","Sadar South","Titas"] },
  { name: "Cox's Bazar", division: "Chattogram", aka: ["Cox's Bazar"], thanas: ["Chakaria","Coxsbazar Sadar","Eidgaon","Kutubdia","Moheshkhali","Pekua","Ramu","Teknaf","Ukhiya"] },
  { name: "Dhaka", division: "Dhaka", thanas: ["Adabor","Airport","Badda","Banani","Bangshal","Bhashantek","Cantonment","Chawkbazar","Dakshinkhan","Darus Salam","Demra","Dhamrai","Dhanmondi","Dohar","Gandaria","Gulshan","Hatirjheel","Hazaribagh","Jatrabari","Kadamtoli","Kafrul","Kalabagan","Kamrangirchar","Keraniganj","Khilgaon","Khilkhet","Kotwali","Lalbagh","Mirpur Model","Mohammadpur","Motijheel","Mugda","Nawabganj","New Market","Pallabi","Paltan Model","Ramna Model","Rampura","Rupnagar","Sabujbagh","Savar","Shah Ali","Shahbagh","Shahjahanpur","Sher-e-Bangla Nagar","Shyampur","Sutrapur","Tejgaon","Tejgaon Industrial Area","Turag","Uttara East","Uttara West","Uttarkhan","Vatara","Wari"] },
  { name: "Dinajpur", division: "Rangpur", thanas: ["Birampur","Birganj","Birol","Bochaganj","Chirirbandar","Dinajpur Sadar","Fulbari","Ghoraghat","Hakimpur","Kaharol","Khansama","Nawabganj","Parbatipur"] },
  { name: "Faridpur", division: "Dhaka", thanas: ["Alfadanga","Bhanga","Boalmari","Charbhadrasan","Faridpur Sadar","Madhukhali","Nagarkanda","Sadarpur","Saltha"] },
  { name: "Feni", division: "Chattogram", thanas: ["Chhagalnaiya","Daganbhuiyan","Feni Sadar","Fulgazi","Parshuram","Sonagazi"] },
  { name: "Gaibandha", division: "Rangpur", thanas: ["Gaibandha Sadar","Gobindaganj","Palashbari","Phulchari","Sadullapur","Saghata","Sundarganj"] },
  { name: "Gazipur", division: "Dhaka", thanas: ["Bason","Gacha","Gazipur Sadar","Joydebpur","Kaliakair","Kaliganj","Kapasia","Kashimpur","Pubail","Sreepur","Tongi East","Tongi West"] },
  { name: "Gopalganj", division: "Dhaka", thanas: ["Gopalganj Sadar","Kashiani","Kotalipara","Muksudpur","Tungipara"] },
  { name: "Habiganj", division: "Sylhet", thanas: ["Ajmiriganj","Bahubal","Baniachong","Chunarughat","Habiganj Sadar","Lakhai","Madhabpur","Nabiganj"] },
  { name: "Jamalpur", division: "Mymensingh", thanas: ["Bokshiganj","Dewangonj","Islampur","Jamalpur Sadar","Madarganj","Melandah","Sarishabari"] },
  { name: "Jashore", division: "Khulna", aka: ["Jessore"], thanas: ["Abhaynagar","Bagherpara","Chougachha","Jashore Sadar","Jhikargacha","Keshabpur","Manirampur","Sharsha"] },
  { name: "Jhalakathi", division: "Barisal", thanas: ["Jhalakathi Sadar","Kathalia","Nalchity","Rajapur"] },
  { name: "Jhenaidah", division: "Khulna", thanas: ["Harinakundu","Jhenaidah Sadar","Kaliganj","Kotchandpur","Moheshpur","Shailkupa"] },
  { name: "Joypurhat", division: "Rajshahi", thanas: ["Akkelpur","Joypurhat Sadar","Kalai","Khetlal","Panchbibi"] },
  { name: "Khagrachhari", division: "Chattogram", thanas: ["Dighinala","Guimara","Khagrachhari Sadar","Laxmichhari","Manikchari","Matiranga","Mohalchari","Panchari","Ramgarh"] },
  { name: "Khulna", division: "Khulna", thanas: ["Aranghata","Botiaghata","Dakop","Daulatpur","Digholia","Dumuria","Fultola","Harintana","Khalishpur","Khan Jahan Ali","Khulna Sadar","Koyra","Labanchara","Paikgasa","Rupsha","Sonadanga","Terokhada"] },
  { name: "Kishoreganj", division: "Dhaka", thanas: ["Austagram","Bajitpur","Bhairab","Hossainpur","Itna","Karimgonj","Katiadi","Kishoreganj Sadar","Kuliarchar","Mithamoin","Nikli","Pakundia","Tarail"] },
  { name: "Kurigram", division: "Rangpur", thanas: ["Bhurungamari","Charrajibpur","Chilmari","Kurigram Sadar","Nageshwari","Phulbari","Rajarhat","Rowmari","Ulipur"] },
  { name: "Kushtia", division: "Khulna", thanas: ["Bheramara","Daulatpur","Khoksa","Kumarkhali","Kushtia Sadar","Mirpur"] },
  { name: "Lakshmipur", division: "Chattogram", thanas: ["Kamalnagar","Lakshmipur Sadar","Raipur","Ramganj","Ramgati"] },
  { name: "Lalmonirhat", division: "Rangpur", thanas: ["Aditmari","Hatibandha","Kaliganj","Lalmonirhat Sadar","Patgram"] },
  { name: "Madaripur", division: "Dhaka", thanas: ["Dasar","Kalkini","Madaripur Sadar","Rajoir","Shibchar"] },
  { name: "Magura", division: "Khulna", thanas: ["Magura Sadar","Mohammadpur","Shalikha","Sreepur"] },
  { name: "Manikganj", division: "Dhaka", thanas: ["Doulatpur","Gior","Harirampur","Manikganj Sadar","Saturia","Shibaloy","Singiar"] },
  { name: "Meherpur", division: "Khulna", thanas: ["Gangni","Meherpur Sadar","Mujibnagar"] },
  { name: "Moulvibazar", division: "Sylhet", thanas: ["Barlekha","Juri","Kamolganj","Kulaura","Moulvibazar Sadar","Rajnagar","Sreemangal"] },
  { name: "Munshiganj", division: "Dhaka", thanas: ["Gajaria","Louhajanj","Munshiganj Sadar","Sirajdikhan","Sreenagar","Tongibari"] },
  { name: "Mymensingh", division: "Mymensingh", thanas: ["Bhaluka","Dhobaura","Fulbaria","Gafargaon","Gouripur","Haluaghat","Iswarganj","Muktagacha","Mymensingh Sadar","Nandail","Phulpur","Tarakanda","Trishal"] },
  { name: "Naogaon", division: "Rajshahi", thanas: ["Atrai","Badalgachi","Dhamoirhat","Manda","Mohadevpur","Naogaon Sadar","Niamatpur","Patnitala","Porsha","Raninagar","Sapahar"] },
  { name: "Narail", division: "Khulna", thanas: ["Kalia","Lohagara","Narail Sadar"] },
  { name: "Narayanganj", division: "Dhaka", thanas: ["Araihazar","Bandar","Narayanganj Sadar","Rupganj","Sonargaon"] },
  { name: "Narsingdi", division: "Dhaka", thanas: ["Belabo","Monohardi","Narsingdi Sadar","Palash","Raipura","Shibpur"] },
  { name: "Natore", division: "Rajshahi", thanas: ["Bagatipara","Baraigram","Gurudaspur","Lalpur","Naldanga","Natore Sadar","Singra"] },
  { name: "Netrokona", division: "Mymensingh", thanas: ["Atpara","Barhatta","Durgapur","Kalmakanda","Kendua","Khaliajuri","Madan","Mohongonj","Netrokona Sadar","Purbadhala"] },
  { name: "Nilphamari", division: "Rangpur", thanas: ["Dimla","Domar","Jaldhaka","Kishorganj","Nilphamari Sadar","Syedpur"] },
  { name: "Noakhali", division: "Chattogram", thanas: ["Begumganj","Chatkhil","Companiganj","Hatia","Kabirhat","Noakhali Sadar","Senbug","Sonaimori","Subarnachar"] },
  { name: "Pabna", division: "Rajshahi", thanas: ["Atghoria","Bera","Bhangura","Chatmohar","Faridpur","Ishurdi","Pabna Sadar","Santhia","Sujanagar"] },
  { name: "Panchagarh", division: "Rangpur", thanas: ["Atwari","Boda","Debiganj","Panchagarh Sadar","Tetulia"] },
  { name: "Patuakhali", division: "Barisal", thanas: ["Bauphal","Dashmina","Dumki","Galachipa","Kalapara","Mirzaganj","Patuakhali Sadar","Rangabali"] },
  { name: "Pirojpur", division: "Barisal", thanas: ["Bhandaria","Kawkhali","Mathbaria","Nazirpur","Nesarabad","Pirojpur Sadar","Zianagar"] },
  { name: "Rajbari", division: "Dhaka", thanas: ["Baliakandi","Goalanda","Kalukhali","Pangsa","Rajbari Sadar"] },
  { name: "Rajshahi", division: "Rajshahi", thanas: ["Airport","Bagha","Bagmara","Belpukur","Boalia","Chandrima","Charghat","Damkura","Durgapur","Godagari","Karnahar","Kasiadanga","Katakhali","Mohonpur","Motihar","Paba","Puthia","Rajpara","Shah Makhdum","Tanore"] },
  { name: "Rangamati", division: "Chattogram", thanas: ["Baghaichari","Barkal","Belaichari","Juraichari","Kaptai","Kawkhali","Langadu","Naniarchar","Rajasthali","Rangamati Sadar"] },
  { name: "Rangpur", division: "Rangpur", thanas: ["Badargonj","Gangachara","Haragach","Hazirhat","Kaunia","Kotwali","Mahiganj","Mithapukur","Parshuram","Pirgacha","Pirgonj","Rangpur Sadar","Tajhat","Taragonj"] },
  { name: "Satkhira", division: "Khulna", thanas: ["Assasuni","Debhata","Kalaroa","Kaliganj","Satkhira Sadar","Shyamnagar","Tala"] },
  { name: "Shariatpur", division: "Dhaka", thanas: ["Bhedarganj","Damudya","Gosairhat","Naria","Shariatpur Sadar","Zajira"] },
  { name: "Sherpur", division: "Mymensingh", thanas: ["Jhenaigati","Nalitabari","Nokla","Sherpur Sadar","Sreebordi"] },
  { name: "Sirajganj", division: "Rajshahi", thanas: ["Belkuchi","Chauhali","Kamarkhand","Kazipur","Raigonj","Shahjadpur","Sirajganj Sadar","Tarash","Ullapara"] },
  { name: "Sunamganj", division: "Sylhet", thanas: ["Bishwambarpur","Chhatak","Derai","Dharmapasha","Dowarabazar","Jagannathpur","Jamalganj","Madhyanagar","Shalla","South Sunamganj","Sunamganj Sadar","Tahirpur"] },
  { name: "Sylhet", division: "Sylhet", thanas: ["Balaganj","Beanibazar","Bimanbandar","Bishwanath","Companiganj","Dakshinsurma","Fenchuganj","Golapganj","Gowainghat","Jaintiapur","Jalalabad","Kanaighat","Kotwali Model","Moglabazar","Osmaninagar","Shah Poran","South Surma","Sylhet Sadar","Zakiganj"] },
  { name: "Tangail", division: "Dhaka", thanas: ["Basail","Bhuapur","Delduar","Dhanbari","Ghatail","Gopalpur","Kalihati","Madhupur","Mirzapur","Nagarpur","Sakhipur","Tangail Sadar"] },
  { name: "Thakurgaon", division: "Rangpur", thanas: ["Baliadangi","Haripur","Pirganj","Ranisankail","Thakurgaon Sadar"] },];

/** Normalised match key: case-, space- and punctuation-insensitive. */
const key = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const BY_KEY = new Map();
for (const d of BD_DISTRICTS) {
  BY_KEY.set(key(d.name), d);
  for (const alias of d.aka ?? []) BY_KEY.set(key(alias), d);
}

/** Finds a district by display name or old spelling. Undefined if unknown. */
export function findDistrict(name) {
  return BY_KEY.get(key(name));
}

/** Thanas of a district, or [] when the district is unknown/unset — so a caller
 * can render the dependent dropdown without null-checking first. */
export function thanasForDistrict(name) {
  return findDistrict(name)?.thanas ?? [];
}

/** True when `thana` belongs to `district`. Used to clear a stale thana when the
 * district changes, and to validate an address loaded from an older order. */
export function isThanaInDistrict(district, thana) {
  const k = key(thana);
  return thanasForDistrict(district).some((t) => key(t) === k);
}

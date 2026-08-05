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
 *  · Dhaka district officially contains only 5 upazilas (Savar, Dhamrai,
 *    Keraniganj, Nawabganj, Dohar) — Dhaka *city* is policed by thanas, not
 *    upazilas, so Dhanmondi, Gulshan, Mirpur and the rest are absent from every
 *    upazila list. Since that's where most orders go, the 50 Dhaka Metropolitan
 *    Police thanas are merged in, from Wikipedia's DMP article. Chattogram has
 *    the same gap, so its 16 CMP thanas are merged in the same way.
 *
 * Where a metro thana duplicates an upazila of the same name (Karnaphuli), the
 * two collapse to one entry — a street address disambiguates them, and two
 * near-identical rows in a dropdown only confuse.
 *
 * `aka` carries the pre-2018 government spellings so a customer typing
 * "Chittagong" or "Jessore" still finds their district.
 *
 * Bundle note: only the checkout and account routes import this (~10 KB raw,
 * ~3 KB gzipped), and both are lazy — it never reaches the storefront bundle.
 */
export const BD_DISTRICTS = [
  { name: "Bagerhat", division: "Khulna", thanas: ["Bagerhat Sadar","Chitalmari","Fakirhat","Kachua","Mollahat","Mongla","Morrelganj","Rampal","Sarankhola"] },
  { name: "Bandarban", division: "Chattogram", thanas: ["Alikadam","Bandarban Sadar","Lama","Naikhongchhari","Rowangchhari","Ruma","Thanchi"] },
  { name: "Barguna", division: "Barisal", thanas: ["Amtali","Bamna","Barguna Sadar","Betagi","Pathorghata","Taltali"] },
  { name: "Barisal", division: "Barisal", aka: ["Barishal"], thanas: ["Agailjhara","Babuganj","Bakerganj","Banaripara","Barisal Sadar","Gournadi","Hizla","Mehendiganj","Muladi","Wazirpur"] },
  { name: "Bhola", division: "Barisal", thanas: ["Bhola Sadar","Borhan Sddin","Charfesson","Doulatkhan","Lalmohan","Monpura","Tazumuddin"] },
  { name: "Bogura", division: "Rajshahi", aka: ["Bogra"], thanas: ["Adamdighi","Bogra Sadar","Dhunot","Dupchanchia","Gabtali","Kahaloo","Nondigram","Shajahanpur","Shariakandi","Sherpur","Shibganj","Sonatala"] },
  { name: "Brahmanbaria", division: "Chattogram", thanas: ["Akhaura","Ashuganj","Bancharampur","Bijoynagar","Brahmanbaria Sadar","Kasba","Nabinagar","Nasirnagar","Sarail"] },
  { name: "Chandpur", division: "Chattogram", thanas: ["Chandpur Sadar","Faridgonj","Haimchar","Hajiganj","Kachua","Matlab North","Matlab South","Shahrasti"] },
  { name: "Chapainawabganj", division: "Rajshahi", thanas: ["Bholahat","Chapainawabganj Sadar","Gomostapur","Nachol","Shibganj"] },
  { name: "Chattogram", division: "Chattogram", aka: ["Chittagong"], thanas: ["Akbarshah","Anwara","Bakoliya","Bandar","Banshkhali","Bayazid","Boalkhali","Chandanaish","Chandgaon","Chawkbazar","Double Mooring","EPZ","Fatikchhari","Halishahar","Hathazari","Karnaphuli","Khulshi","Kotwali","Lohagara","Mirsharai","Pahartali","Panchlaish","Patenga","Patiya","Rangunia","Raozan","Sadarghat","Sandwip","Satkania","Sitakunda"] },
  { name: "Chuadanga", division: "Khulna", thanas: ["Alamdanga","Chuadanga Sadar","Damurhuda","Jibannagar"] },
  { name: "Comilla", division: "Chattogram", aka: ["Cumilla"], thanas: ["Barura","Brahmanpara","Burichang","Chandina","Chauddagram","Comilla Sadar","Daudkandi","Debidwar","Homna","Laksam","Lalmai","Meghna","Monohargonj","Muradnagar","Nangalkot","Sadarsouth","Titas"] },
  { name: "Cox's Bazar", division: "Chattogram", aka: ["Cox's Bazar"], thanas: ["Chakaria","Coxsbazar Sadar","Eidgaon","Kutubdia","Moheshkhali","Pekua","Ramu","Teknaf","Ukhiya"] },
  { name: "Dhaka", division: "Dhaka", thanas: ["Adabor","Airport","Badda","Banani","Bangshal","Bhashantek","Cantonment","Chawkbazar","Dakshinkhan","Darus Salam","Demra","Dhamrai","Dhanmondi","Dohar","Gandaria","Gulshan","Hatirjheel","Hazaribagh","Jatrabari","Kadamtoli","Kafrul","Kalabagan","Kamrangirchar","Keraniganj","Khilgaon","Khilkhet","Kotwali","Lalbagh","Mirpur Model","Mohammadpur","Motijheel","Mugda","Nawabganj","New Market","Pallabi","Paltan Model","Ramna Model","Rampura","Rupnagar","Sabujbagh","Savar","Shah Ali","Shahbagh","Shahjahanpur","Sher-e-Bangla Nagar","Shyampur","Sutrapur","Tejgaon","Tejgaon Industrial Area","Turag","Uttara East","Uttara West","Uttarkhan","Vatara","Wari"] },
  { name: "Dinajpur", division: "Rangpur", thanas: ["Birampur","Birganj","Birol","Bochaganj","Chirirbandar","Dinajpur Sadar","Fulbari","Ghoraghat","Hakimpur","Kaharol","Khansama","Nawabganj","Parbatipur"] },
  { name: "Faridpur", division: "Dhaka", thanas: ["Alfadanga","Bhanga","Boalmari","Charbhadrasan","Faridpur Sadar","Madhukhali","Nagarkanda","Sadarpur","Saltha"] },
  { name: "Feni", division: "Chattogram", thanas: ["Chhagalnaiya","Daganbhuiyan","Feni Sadar","Fulgazi","Parshuram","Sonagazi"] },
  { name: "Gaibandha", division: "Rangpur", thanas: ["Gaibandha Sadar","Gobindaganj","Palashbari","Phulchari","Sadullapur","Saghata","Sundarganj"] },
  { name: "Gazipur", division: "Dhaka", thanas: ["Gazipur Sadar","Kaliakair","Kaliganj","Kapasia","Sreepur"] },
  { name: "Gopalganj", division: "Dhaka", thanas: ["Gopalganj Sadar","Kashiani","Kotalipara","Muksudpur","Tungipara"] },
  { name: "Habiganj", division: "Sylhet", thanas: ["Ajmiriganj","Bahubal","Baniachong","Chunarughat","Habiganj Sadar","Lakhai","Madhabpur","Nabiganj"] },
  { name: "Jamalpur", division: "Mymensingh", thanas: ["Bokshiganj","Dewangonj","Islampur","Jamalpur Sadar","Madarganj","Melandah","Sarishabari"] },
  { name: "Jashore", division: "Khulna", aka: ["Jessore"], thanas: ["Abhaynagar","Bagherpara","Chougachha","Jessore Sadar","Jhikargacha","Keshabpur","Manirampur","Sharsha"] },
  { name: "Jhalakathi", division: "Barisal", thanas: ["Jhalakathi Sadar","Kathalia","Nalchity","Rajapur"] },
  { name: "Jhenaidah", division: "Khulna", thanas: ["Harinakundu","Jhenaidah Sadar","Kaliganj","Kotchandpur","Moheshpur","Shailkupa"] },
  { name: "Joypurhat", division: "Rajshahi", thanas: ["Akkelpur","Joypurhat Sadar","Kalai","Khetlal","Panchbibi"] },
  { name: "Khagrachhari", division: "Chattogram", thanas: ["Dighinala","Guimara","Khagrachhari Sadar","Laxmichhari","Manikchari","Matiranga","Mohalchari","Panchari","Ramgarh"] },
  { name: "Khulna", division: "Khulna", thanas: ["Botiaghata","Dakop","Digholia","Dumuria","Fultola","Koyra","Paikgasa","Rupsha","Terokhada"] },
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
  { name: "Rajshahi", division: "Rajshahi", thanas: ["Bagha","Bagmara","Charghat","Durgapur","Godagari","Mohonpur","Paba","Puthia","Tanore"] },
  { name: "Rangamati", division: "Chattogram", thanas: ["Baghaichari","Barkal","Belaichari","Juraichari","Kaptai","Kawkhali","Langadu","Naniarchar","Rajasthali","Rangamati Sadar"] },
  { name: "Rangpur", division: "Rangpur", thanas: ["Badargonj","Gangachara","Kaunia","Mithapukur","Pirgacha","Pirgonj","Rangpur Sadar","Taragonj"] },
  { name: "Satkhira", division: "Khulna", thanas: ["Assasuni","Debhata","Kalaroa","Kaliganj","Satkhira Sadar","Shyamnagar","Tala"] },
  { name: "Shariatpur", division: "Dhaka", thanas: ["Bhedarganj","Damudya","Gosairhat","Naria","Shariatpur Sadar","Zajira"] },
  { name: "Sherpur", division: "Mymensingh", thanas: ["Jhenaigati","Nalitabari","Nokla","Sherpur Sadar","Sreebordi"] },
  { name: "Sirajganj", division: "Rajshahi", thanas: ["Belkuchi","Chauhali","Kamarkhand","Kazipur","Raigonj","Shahjadpur","Sirajganj Sadar","Tarash","Ullapara"] },
  { name: "Sunamganj", division: "Sylhet", thanas: ["Bishwambarpur","Chhatak","Derai","Dharmapasha","Dowarabazar","Jagannathpur","Jamalganj","Madhyanagar","Shalla","South Sunamganj","Sunamganj Sadar","Tahirpur"] },
  { name: "Sylhet", division: "Sylhet", thanas: ["Balaganj","Beanibazar","Bishwanath","Companiganj","Dakshinsurma","Fenchuganj","Golapganj","Gowainghat","Jaintiapur","Kanaighat","Osmaninagar","Sylhet Sadar","Zakiganj"] },
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

/** Bangladesh districts and their delivery zones, for the checkout address picker.
 *
 * THE LIST IS STEADFAST'S OWN, fetched from their `GET /police_stations`
 * endpoint (portal.packzy.com/api/v1) with the merchant's API credentials.
 * That is deliberate and is the whole point: DiecastBD ships via Steadfast, so
 * the merchant re-types every customer address into Steadfast's panel. When our
 * names were the official administrative ones they did not match — we said
 * "Jatrabari", "Mirpur Model", "Hazaribagh"; Steadfast says "Jattrabari",
 * "Mirpur", "Hazaribag" — and areas the courier delivers to, like
 * Bashundhara R/A, Panthapath and Gulistan, were not offered at all because
 * they are zones rather than thanas. Now what the customer picks is verbatim
 * what the merchant selects at the courier.
 *
 * Shape: each thana is { n } — the Steadfast name — plus optional { a }, the
 * OFFICIAL spellings that mean the same place. Those are search aliases only:
 * they are never displayed and never stored, they just let a customer who types
 * "Jatrabari" or "Uttara East" find the courier's entry. 142 are attached.
 *
 * How the aliases were derived, and the trap avoided: edit distance alone
 * proposed pairs like Gulistan<-Gulshan (opposite ends of Dhaka), Lama<-Ruma,
 * Amtali<-Taltali and Ramganj<-Ramgati. Aliasing those would let someone search
 * their own area and be handed a different one, so a name Steadfast already
 * lists independently is never treated as a misspelling of another. Bengali/
 * English equivalents no string metric can see (South Surma = Dakshinsurma,
 * Motlab dokkhin = Matlab South) are a short hand-reviewed list in the
 * generator, and every pairing was read before shipping.
 *
 * Steadfast splits the capital into "Dhaka City" and "Dhaka Sub-Urban"; those
 * are merged into one Dhaka, since a customer picks a district and does not
 * know which side of that line they live on. Their pre-2018 district spellings
 * (Bogra, Chittagong, Cumilla) are kept as `aka` search terms while we display
 * the modern names. Their "Zone Not Clear" catch-all row is dropped, and their
 * duplicate rows collapsed.
 *
 * 28 official thanas have no Steadfast equivalent (most of Khulna's and
 * Rangpur's metropolitan thanas). That is not data loss: Steadfast covers those
 * cities under its own zone names — Khulna city is Khulna Sadar, Circuit House,
 * Gollamari and Mujgunni — and a place the courier does not list is a place it
 * will not collect from, so offering it would be the real error.
 *
 * To refresh: re-run scratchpad/gen-sf.mjs against the endpoint. Credentials
 * live outside the repo and are never committed.
 *
 * Bundle note: only the checkout and account routes import this, and both are
 * lazy — it never reaches the storefront bundle.
 */
export const BD_DISTRICTS = [
  { name: "Bagerhat", division: "Khulna", thanas: [{"n":"Bagerhat sadar"},{"n":"Chitalmari"},{"n":"Fakirhat"},{"n":"Kachua upazila","a":["Kachua"]},{"n":"Mollahat"},{"n":"Mongla"},{"n":"Morrelganj"},{"n":"Nul"},{"n":"Null"},{"n":"Rampal"},{"n":"Sarankhola"},{"n":"test thana"}] },
  { name: "Bandarban", division: "Chattogram", thanas: [{"n":"Ali Kadam","a":["Alikadam"]},{"n":"Bandarban sadar"},{"n":"Lama"},{"n":"Naikhongchari","a":["Naikhongchhari"]},{"n":"Rowangchhari"},{"n":"Ruma"},{"n":"Thanchi"}] },
  { name: "Barguna", division: "Barisal", thanas: [{"n":"Amtali"},{"n":"Bamna"},{"n":"Barguna sadar"},{"n":"Betagi"},{"n":"Patharghata","a":["Pathorghata"]},{"n":"Taltali"}] },
  { name: "Barisal", division: "Barisal", aka: ["Barishal"], thanas: [{"n":"Agailjhara"},{"n":"Babuganj"},{"n":"Bakerganj"},{"n":"Banaripara"},{"n":"Barishal Sadar","a":["Barisal Sadar"]},{"n":"Charkaua"},{"n":"Goriarpar"},{"n":"Gouronadi","a":["Gournadi"]},{"n":"Hizla"},{"n":"Mehendiganj"},{"n":"Muladi"},{"n":"Natun Bazar"},{"n":"Wazirpur"}] },
  { name: "Bhola", division: "Barisal", thanas: [{"n":"Bhola Sadar"},{"n":"Borhanuddin","a":["Borhan Sddin"]},{"n":"Char fasson","a":["Charfesson"]},{"n":"Daulatkhan","a":["Doulatkhan"]},{"n":"Dularhat (Charfession)"},{"n":"KunjerHat"},{"n":"Lalmohan"},{"n":"Manpura","a":["Monpura"]},{"n":"Soshivusion"},{"n":"Tazumuddin"}] },
  { name: "Bogura", division: "Rajshahi", aka: ["Bogra"], thanas: [{"n":"Alamdighi","a":["Adamdighi"]},{"n":"Baropur (Bogura)"},{"n":"Bogura Sadar"},{"n":"Dhunat","a":["Dhunot"]},{"n":"Dhupchancia","a":["Dupchanchia"]},{"n":"Gabtoli","a":["Gabtali"]},{"n":"Kahaloo"},{"n":"Nandigram","a":["Nondigram"]},{"n":"Saraikandi"},{"n":"Shajahanpur"},{"n":"Sherpur"},{"n":"Shibganj"},{"n":"Sonatola","a":["Sonatala"]}] },
  { name: "Brahmanbaria", division: "Chattogram", thanas: [{"n":"Akhaura"},{"n":"Aruail (Sarail)"},{"n":"Ashuganj"},{"n":"Bancharampur"},{"n":"Bijoynagar"},{"n":"Brahmanbaria Sadar"},{"n":"Chargach (Kasba)"},{"n":"Chatalpar Nasirnagar"},{"n":"Kasba"},{"n":"Krishnanagar (Nabinagar)"},{"n":"Nabinagar"},{"n":"Nasirnagar"},{"n":"Radhika (B Baria)"},{"n":"Rupasdi (Banchrampur)"},{"n":"Sarail"},{"n":"Shibpur (Brahmanbaria)"},{"n":"Shyamgram (Nabinagar)"}] },
  { name: "Chandpur", division: "Chattogram", thanas: [{"n":"Babur Hat (Chandpur)"},{"n":"Chandpur Sadar"},{"n":"Chowrangi (Faridganj)"},{"n":"Dhakirgaon"},{"n":"Faridganj","a":["Faridgonj"]},{"n":"Haimchar"},{"n":"Hajiganj"},{"n":"Kachua"},{"n":"Matlab North"},{"n":"Motlab dokkhin","a":["Matlab South"]},{"n":"Palakhal (Kachua)"},{"n":"Shahrasti"}] },
  { name: "Chapainawabganj", division: "Rajshahi", thanas: [{"n":"Bholahat"},{"n":"Chapainawabganj sadar"},{"n":"Gomastapur","a":["Gomostapur"]},{"n":"Nachole","a":["Nachol"]},{"n":"Shibganj sadar","a":["Shibganj"]}] },
  { name: "Chattogram", division: "Chattogram", aka: ["Chittagong"], thanas: [{"n":"Akbar Shah","a":["Akbarshah"]},{"n":"Anwara"},{"n":"Bakolia","a":["Bakoliya"]},{"n":"Bandar - CTG","a":["Bandar"]},{"n":"Banskhali","a":["Banshkhali"]},{"n":"Bayazid Bostami","a":["Bayazid"]},{"n":"Bhujpur"},{"n":"Boalkhali"},{"n":"CEPZ","a":["EPZ"]},{"n":"Chandanaish"},{"n":"Chandgaon"},{"n":"Chawk Bazar","a":["Chawkbazar"]},{"n":"Chittagong Sadar"},{"n":"Doublemooring","a":["Double Mooring"]},{"n":"Fatikchori","a":["Fatikchhari"]},{"n":"Halishahar"},{"n":"Hathazari"},{"n":"Karnaphuli"},{"n":"KeraniHat"},{"n":"Khulshi"},{"n":"Kotwali - CTG","a":["Kotwali"]},{"n":"Lohagara"},{"n":"Mirsharai"},{"n":"Pahartali"},{"n":"Panchlaish"},{"n":"Patenga"},{"n":"Patiya"},{"n":"Rangunia"},{"n":"Raozan"},{"n":"Sadarghat - CTG","a":["Sadarghat"]},{"n":"Sandwip"},{"n":"Satkania"},{"n":"Shantirhat(Patiya)-CTG"},{"n":"Sitakunda"},{"n":"Sitakunda ( Citygate)"},{"n":"Time Bazar (Banskhali)"},{"n":"Zorarganj"}] },
  { name: "Chuadanga", division: "Khulna", thanas: [{"n":"Alamdanga"},{"n":"Chuadanga Sadar"},{"n":"Damurhuda"},{"n":"Darshana"},{"n":"Jibannagar"}] },
  { name: "Comilla", division: "Chattogram", aka: ["Cumilla"], thanas: [{"n":"Bangora-Bazar"},{"n":"Barura"},{"n":"Batisha (Chauddagram)"},{"n":"Bottali (Nangalkot)"},{"n":"Brahmanpara"},{"n":"Burichang"},{"n":"Cantonment ( Cumilla)"},{"n":"Chandina"},{"n":"Chauddagram"},{"n":"Cumilla Sadar South Model"},{"n":"Daudkandi"},{"n":"Debidwar"},{"n":"Gouripur (Cumilla)"},{"n":"Homna"},{"n":"Jahapur (Muradnagar)"},{"n":"Kandirpar"},{"n":"Kotbari"},{"n":"Kotwali Model"},{"n":"Laksam"},{"n":"Lalmai"},{"n":"Meghna"},{"n":"Metanghar(Muradnagar)"},{"n":"Monoharganj","a":["Monohargonj"]},{"n":"Mudafargonj"},{"n":"Muradnagar"},{"n":"Nangalkot"},{"n":"Nawabpur (Chandina)"},{"n":"Titas"}] },
  { name: "Cox's Bazar", division: "Chattogram", thanas: [{"n":"Badarkhali (Chakaria)"},{"n":"Baraitoli (Chakaria)"},{"n":"Chakaria"},{"n":"Cox's Bazar Sadar","a":["Coxsbazar Sadar"]},{"n":"Dulahazara (Chakaria)"},{"n":"Eidgaon"},{"n":"Eidgor(Ramu)"},{"n":"Garjania (Ramu)"},{"n":"Gorakghata(Moheshkhali)"},{"n":"Khurushkul"},{"n":"Kutubdia"},{"n":"Link Road"},{"n":"Moheskhali","a":["Moheshkhali"]},{"n":"Nhila (Teknaf)"},{"n":"Palongkhali (Ukhiya)"},{"n":"Pekua"},{"n":"Ramu"},{"n":"Shamlapur (Teknaf)"},{"n":"Sonarpara(Ukhiya)"},{"n":"Teknaf,টেকনাফ","a":["Teknaf"]},{"n":"Ukhiya"}] },
  { name: "Dhaka", division: "Dhaka", thanas: [{"n":"Adabor"},{"n":"Airport"},{"n":"Ashulia"},{"n":"Ati Bazar (Keraniganj)"},{"n":"Azompur"},{"n":"Badda"},{"n":"Banani"},{"n":"Bangshal"},{"n":"Bashundhara R/A"},{"n":"Battery Section"},{"n":"Bhashantek"},{"n":"Cantonment"},{"n":"Chalkbazar","a":["Chawkbazar"]},{"n":"Dakshin khan","a":["Dakshinkhan"]},{"n":"Darus Salam"},{"n":"Demra"},{"n":"Dhamrai"},{"n":"Dhanmondi"},{"n":"Dohar"},{"n":"Gandaria"},{"n":"Gulistan"},{"n":"Gulshan"},{"n":"Hatirjheel"},{"n":"Hazaribag","a":["Hazaribagh"]},{"n":"Hemayetpur"},{"n":"Jattrabari","a":["Jatrabari"]},{"n":"Kadamtali","a":["Kadamtoli"]},{"n":"Kafrul"},{"n":"Kalabagan"},{"n":"Kamrangirchar"},{"n":"Keraniganj Model","a":["Keraniganj"]},{"n":"Khilgaon"},{"n":"Khilkhet"},{"n":"Kotwali"},{"n":"Lalbagh"},{"n":"Mirpur","a":["Mirpur Model"]},{"n":"Mohammadpur"},{"n":"Motijheel"},{"n":"Mugda"},{"n":"Nawabganj"},{"n":"New Market"},{"n":"Pallabi"},{"n":"Paltan","a":["Paltan Model"]},{"n":"Panthapath"},{"n":"Purbachal"},{"n":"Ramna","a":["Ramna Model"]},{"n":"Rampura"},{"n":"Rupnagar"},{"n":"Sabujbag","a":["Sabujbagh"]},{"n":"Savar"},{"n":"Shah Ali"},{"n":"Shah Ali Market"},{"n":"Shahbag","a":["Shahbagh"]},{"n":"Shahjahanpur"},{"n":"Sher-e-Bangla Nagar"},{"n":"Shyampur"},{"n":"South Keraniganj"},{"n":"Sutrapur"},{"n":"Tejgaon"},{"n":"Tejgaon Industrial Area"},{"n":"Turag"},{"n":"Uttara","a":["Uttara East","Uttara West"]},{"n":"Uttarkhan"},{"n":"Vasantek"},{"n":"Vatara"},{"n":"Wari"}] },
  { name: "Dinajpur", division: "Rangpur", thanas: [{"n":"Biral","a":["Birol"]},{"n":"Birampur"},{"n":"Birganj"},{"n":"Bochaganj"},{"n":"Chirirbandar"},{"n":"Dinajpur Sadar"},{"n":"Fulbari // ফুলবাড়ি","a":["Fulbari"]},{"n":"Ghoraghat"},{"n":"Hakimpur"},{"n":"Kaharole","a":["Kaharol"]},{"n":"Khansama"},{"n":"Khulahati"},{"n":"Nawabganj Upazila","a":["Nawabganj"]},{"n":"Parbatipur"}] },
  { name: "Faridpur", division: "Dhaka", thanas: [{"n":"Alfadanga"},{"n":"Bhanga"},{"n":"Boalmari"},{"n":"Charbhadrasan"},{"n":"Faridpur Sadar"},{"n":"Madhukhali"},{"n":"Nagarkanda"},{"n":"Niltuli"},{"n":"Sadarpur"},{"n":"Shaltha","a":["Saltha"]}] },
  { name: "Feni", division: "Chattogram", thanas: [{"n":"Chagalnaiya","a":["Chhagalnaiya"]},{"n":"Dagunbhuiyan","a":["Daganbhuiyan"]},{"n":"Feni sadar"},{"n":"Fulgazi"},{"n":"Mohipal"},{"n":"Parshuram"},{"n":"Sonagazi"}] },
  { name: "Gaibandha", division: "Rangpur", thanas: [{"n":"Dariapur"},{"n":"Fulchari","a":["Phulchari"]},{"n":"Gabindaganj","a":["Gobindaganj"]},{"n":"Gaibandha Sadar"},{"n":"Palashbari"},{"n":"Sadullapur"},{"n":"Saghata"},{"n":"Sundarganj"}] },
  { name: "Gazipur", division: "Dhaka", thanas: [{"n":"Gazipur Sadar"},{"n":"Kaliakair"},{"n":"Kaliakair Upazila"},{"n":"Kaliganj upazila","a":["Kaliganj"]},{"n":"kapasia"},{"n":"Kashimpur"},{"n":"Memberbari (Gazipur)"},{"n":"Nayanpur (Sreepur)"},{"n":"Rajendrapur"},{"n":"Sreepur"},{"n":"Tongi","a":["Tongi East","Tongi West"]}] },
  { name: "Gopalganj", division: "Dhaka", thanas: [{"n":"Boultali"},{"n":"Gopalganj Sadar"},{"n":"kasiani","a":["Kashiani"]},{"n":"Kotalipara"},{"n":"Muksudpur"},{"n":"tungipara"}] },
  { name: "Habiganj", division: "Sylhet", thanas: [{"n":"Ajmiriganj"},{"n":"Aushkandi (Nabiganj)"},{"n":"Bahubal"},{"n":"Baniachong"},{"n":"Chunarughat"},{"n":"Habiganj Sadar"},{"n":"Lakhai"},{"n":"Madhobpur","a":["Madhabpur"]},{"n":"Markuli (Nabiganj)"},{"n":"Nabiganj"},{"n":"Shayestaganj"}] },
  { name: "Jamalpur", division: "Mymensingh", thanas: [{"n":"Baksiganj","a":["Bokshiganj"]},{"n":"Dewanganj","a":["Dewangonj"]},{"n":"Digpait"},{"n":"Islampur"},{"n":"Jamalpur Sadar"},{"n":"Madarganj"},{"n":"Melandaha","a":["Melandah"]},{"n":"Nandina"},{"n":"Sarishabari"}] },
  { name: "Jashore", division: "Khulna", aka: ["Jessore"], thanas: [{"n":"Abhaynagar"},{"n":"Bagharpara","a":["Bagherpara"]},{"n":"Bakchar"},{"n":"Chaugacha","a":["Chougachha"]},{"n":"Jashore Sadar"},{"n":"Jikhargacha","a":["Jhikargacha"]},{"n":"keshobpur","a":["Keshabpur"]},{"n":"Manirampur"},{"n":"Sharsha"}] },
  { name: "Jhalakathi", division: "Barisal", aka: ["Jhalokati"], thanas: [{"n":"Jhalokati sadar","a":["Jhalakathi Sadar"]},{"n":"Kathalia"},{"n":"Nalchity"},{"n":"Rajapur"}] },
  { name: "Jhenaidah", division: "Khulna", thanas: [{"n":"Dakbangla"},{"n":"Harinakunda","a":["Harinakundu"]},{"n":"Hatgopalpur"},{"n":"Jhenaidah Sadar"},{"n":"Kaliganj"},{"n":"Kotchandpur"},{"n":"Maheshpur","a":["Moheshpur"]},{"n":"Shailkupa"}] },
  { name: "Joypurhat", division: "Rajshahi", thanas: [{"n":"Akkelpur"},{"n":"Joypurhat Sadar"},{"n":"Kalai"},{"n":"Khetlal"},{"n":"Panchbibi"}] },
  { name: "Khagrachhari", division: "Chattogram", aka: ["Khagrachori"], thanas: [{"n":"Dighinala"},{"n":"Guimara"},{"n":"khagrachari sadar","a":["Khagrachhari Sadar"]},{"n":"Laxmichari","a":["Laxmichhari"]},{"n":"Mahalchari","a":["Mohalchari"]},{"n":"Manikchhari","a":["Manikchari"]},{"n":"Matiranga"},{"n":"Panchari"},{"n":"Ramgarh"}] },
  { name: "Khulna", division: "Khulna", thanas: [{"n":"Batiaghata","a":["Botiaghata"]},{"n":"Circuit House"},{"n":"Dacope","a":["Dakop"]},{"n":"Daulatpur (Khulna)","a":["Daulatpur"]},{"n":"Dighalia","a":["Digholia"]},{"n":"Dumuria"},{"n":"Gollamari (Khulna)"},{"n":"Khulna Sadar"},{"n":"Koyra"},{"n":"Mujgunni"},{"n":"Paikgacha","a":["Paikgasa"]},{"n":"Phultala","a":["Fultola"]},{"n":"Rupsha"},{"n":"Terokhada"}] },
  { name: "Kishoreganj", division: "Dhaka", thanas: [{"n":"Abdullahpur (Austagram)"},{"n":"Austagram"},{"n":"Bajitpur"},{"n":"Bhairab"},{"n":"Hossainpur"},{"n":"Itna"},{"n":"Karimganj","a":["Karimgonj"]},{"n":"Katiadi"},{"n":"kishoreganj Sadar"},{"n":"Kuliarchar"},{"n":"Mithamain","a":["Mithamoin"]},{"n":"Nikli"},{"n":"Pakundia"},{"n":"Tarail"}] },
  { name: "Kurigram", division: "Rangpur", thanas: [{"n":"Bhurungamari"},{"n":"Char Rajibpur","a":["Charrajibpur"]},{"n":"Chilmari"},{"n":"fulbari"},{"n":"Kachakata"},{"n":"kurigram sadar"},{"n":"Nageshwari"},{"n":"Phulbari"},{"n":"Rajarhat"},{"n":"Raomari","a":["Rowmari"]},{"n":"Ulipur"}] },
  { name: "Kushtia", division: "Khulna", aka: ["Kustia"], thanas: [{"n":"Bheramara"},{"n":"Bittipara EB"},{"n":"Daulatpur"},{"n":"Khoksa"},{"n":"Kumarkhali"},{"n":"Kushtia Sadar"},{"n":"Mirpur upazila","a":["Mirpur"]}] },
  { name: "Lakshmipur", division: "Chattogram", aka: ["Laxmipur"], thanas: [{"n":"Banchanagar (Laxmipur)"},{"n":"Chandraganj"},{"n":"Kamalnagar"},{"n":"Laxmipur Sadar"},{"n":"Raipur"},{"n":"Ramganj"},{"n":"Ramgati"}] },
  { name: "Lalmonirhat", division: "Rangpur", thanas: [{"n":"Aditmari"},{"n":"Hatibandha"},{"n":"Kaliganj sadar","a":["Kaliganj"]},{"n":"Lalmonirhat Sadar"},{"n":"Patgram"}] },
  { name: "Madaripur", division: "Dhaka", thanas: [{"n":"Dasar"},{"n":"Kalkini"},{"n":"Madaripur sadar"},{"n":"Rajoir"},{"n":"Shibchar"}] },
  { name: "Magura", division: "Khulna", thanas: [{"n":"Magura sadar"},{"n":"Mohammadpur upazila","a":["Mohammadpur"]},{"n":"Shalikha"},{"n":"Sreepur upazila","a":["Sreepur"]}] },
  { name: "Manikganj", division: "Dhaka", thanas: [{"n":"Boro Sorundi (Manikganj)"},{"n":"Daulatpur upazila","a":["Doulatpur"]},{"n":"Ghior","a":["Gior"]},{"n":"Harirampur"},{"n":"Jamirta, Singair"},{"n":"Manikganj Sadar"},{"n":"Saturia"},{"n":"Shivalaya"},{"n":"Singair","a":["Singiar"]}] },
  { name: "Meherpur", division: "Khulna", thanas: [{"n":"Gangni"},{"n":"Meherpur sadar"},{"n":"Mujibnagar"}] },
  { name: "Moulvibazar", division: "Sylhet", thanas: [{"n":"Barlekha (Moulvibazar)","a":["Barlekha"]},{"n":"Dakshinbhag"},{"n":"Juri"},{"n":"Kamolganj"},{"n":"Kulaura"},{"n":"Moulvibazar Sadar"},{"n":"Rajnagar"},{"n":"Robirbazar (Moulvibazar)"},{"n":"Sherpur Moulvibazar"},{"n":"Sreemangal"}] },
  { name: "Munshiganj", division: "Dhaka", thanas: [{"n":"Gazaria","a":["Gajaria"]},{"n":"Louhajang","a":["Louhajanj"]},{"n":"Munshiganj Sadar"},{"n":"Sirajdikhan"},{"n":"Sreenagar"},{"n":"Tongibari"}] },
  { name: "Mymensingh", division: "Mymensingh", thanas: [{"n":"Bhaluka"},{"n":"Dhobaura"},{"n":"Fulbaria"},{"n":"Gafargaon"},{"n":"Gouripur"},{"n":"Haluaghat"},{"n":"Ishwarganj","a":["Iswarganj"]},{"n":"Muktagacha"},{"n":"Mymensingh Sadar"},{"n":"Nandail"},{"n":"Pagla"},{"n":"Phulpur"},{"n":"Shambhuganj"},{"n":"Square Masterbari (Bhaluka)"},{"n":"Tarakanda"},{"n":"Trishal"}] },
  { name: "Naogaon", division: "Rajshahi", thanas: [{"n":"Atrai"},{"n":"Badolgachi","a":["Badalgachi"]},{"n":"Dhamoirhat"},{"n":"Manda"},{"n":"Mohadevpur"},{"n":"Naogaon sadar"},{"n":"Niamatpur"},{"n":"Patnitala"},{"n":"Porsha"},{"n":"Raninagar"},{"n":"Sapahar"}] },
  { name: "Narail", division: "Khulna", thanas: [{"n":"Kalia"},{"n":"Lohagara"},{"n":"Naragati"},{"n":"Narail Sadar"}] },
  { name: "Narayanganj", division: "Dhaka", thanas: [{"n":"Araihajar","a":["Araihazar"]},{"n":"Bandar"},{"n":"Fatullah"},{"n":"Kanchpur Highway"},{"n":"Narayanganj Sadar"},{"n":"Rupganj"},{"n":"Shiddhirganj"},{"n":"Sonargaon"}] },
  { name: "Narsingdi", division: "Dhaka", aka: ["Narshindi"], thanas: [{"n":"Belabo"},{"n":"Ghorashal"},{"n":"Madhobdi"},{"n":"Monohardi"},{"n":"Narsingdi Sadar"},{"n":"Palash"},{"n":"Raipura"},{"n":"Shibpur"}] },
  { name: "Natore", division: "Rajshahi", thanas: [{"n":"Bagatipara"},{"n":"Baraigram"},{"n":"Bonpara Pourosova"},{"n":"Gopalpur Pourosova"},{"n":"Gurudaspur"},{"n":"Lalpur"},{"n":"Naldanga"},{"n":"Natore Sadar"},{"n":"Singra"}] },
  { name: "Netrokona", division: "Mymensingh", thanas: [{"n":"Atpara"},{"n":"Barhatta"},{"n":"Durgapur"},{"n":"Kalmakanda"},{"n":"Kendua"},{"n":"Khaliajuri"},{"n":"Madan"},{"n":"Mohonganj","a":["Mohongonj"]},{"n":"Netrokona Sadar"},{"n":"Parbadhala","a":["Purbadhala"]},{"n":"Shyamganj"}] },
  { name: "Nilphamari", division: "Rangpur", thanas: [{"n":"Dimla"},{"n":"Domar"},{"n":"jaldhaka"},{"n":"kishoreganj","a":["Kishorganj"]},{"n":"Nilphamari Sadar"},{"n":"Saidpur","a":["Syedpur"]}] },
  { name: "Noakhali", division: "Chattogram", thanas: [{"n":"Amishapara (Sonaimuri)"},{"n":"Begamganj","a":["Begumganj"]},{"n":"Chaprashirhat (Companiganj)"},{"n":"Chatkhil"},{"n":"Chhayani (Begumganj)"},{"n":"Companyganj","a":["Companiganj"]},{"n":"Hatiya","a":["Hatia"]},{"n":"Jamidarhat(Begumganj)"},{"n":"Kabir Hat","a":["Kabirhat"]},{"n":"Khalifarhat"},{"n":"Maijdee Bazar"},{"n":"Nijhum Dwip"},{"n":"Noakhali Sadar"},{"n":"Senbagh","a":["Senbug"]},{"n":"Sonaimuri","a":["Sonaimori"]},{"n":"Subarnachar"}] },
  { name: "Pabna", division: "Rajshahi", thanas: [{"n":"Ataikula (Pabna)"},{"n":"Atgharia","a":["Atghoria"]},{"n":"Bera"},{"n":"Bhangura"},{"n":"Chatmohar"},{"n":"Foridpur (Pabna)","a":["Faridpur"]},{"n":"Ishwardi","a":["Ishurdi"]},{"n":"Pabna Sadar"},{"n":"Santhia"},{"n":"Sujanagar"}] },
  { name: "Panchagarh", division: "Rangpur", aka: ["Panchgarh"], thanas: [{"n":"Atwari"},{"n":"Boda"},{"n":"Debiganj"},{"n":"Panchgarh sadar Thana","a":["Panchagarh Sadar"]},{"n":"Tetulia"}] },
  { name: "Patuakhali", division: "Barisal", thanas: [{"n":"Bablatola"},{"n":"Bauphal"},{"n":"Dashmina"},{"n":"Dumki"},{"n":"Galachipa"},{"n":"Kalapara"},{"n":"Kalisuri"},{"n":"Mahipur"},{"n":"Mirzaganj"},{"n":"Patuakhali Sadar"},{"n":"Rangabali"}] },
  { name: "Pirojpur", division: "Barisal", thanas: [{"n":"Bhandaria"},{"n":"Inderhat"},{"n":"Kawkhali"},{"n":"Mathbaria"},{"n":"Nazirpur"},{"n":"Nesarabad"},{"n":"Pirojpur Sadar"},{"n":"Safa (Mathbaria)"},{"n":"Swarupkati"},{"n":"Zianagar"}] },
  { name: "Rajbari", division: "Dhaka", thanas: [{"n":"(Goalanda Mor) Rajbari Office"},{"n":"Baliakandi"},{"n":"Goalananda","a":["Goalanda"]},{"n":"Kalukhali"},{"n":"pangsha","a":["Pangsa"]},{"n":"Rajbari Sadar"}] },
  { name: "Rajshahi", division: "Rajshahi", thanas: [{"n":"Airport (Rajshahi)","a":["Airport"]},{"n":"Bagha"},{"n":"Bagmara"},{"n":"Belpukur"},{"n":"Boalia"},{"n":"Chandrima Thana","a":["Chandrima"]},{"n":"Charghat"},{"n":"Damkura"},{"n":"Durgapur"},{"n":"Godagari"},{"n":"Kashiadanga","a":["Kasiadanga"]},{"n":"Katakhali"},{"n":"Kornohar","a":["Karnahar"]},{"n":"Matihar Thana","a":["Motihar"]},{"n":"Mohanpur","a":["Mohonpur"]},{"n":"Paba"},{"n":"Puthia"},{"n":"Rajpara"},{"n":"Rajshahi Sadar"},{"n":"Shah Makdam","a":["Shah Makhdum"]},{"n":"Tanore"}] },
  { name: "Rangamati", division: "Chattogram", thanas: [{"n":"Bagaichhari","a":["Baghaichari"]},{"n":"Barkal"},{"n":"Belaichhari","a":["Belaichari"]},{"n":"Juraichhari","a":["Juraichari"]},{"n":"Kaptai"},{"n":"Kawkhali upazila","a":["Kawkhali"]},{"n":"Langadu"},{"n":"Naniarchar"},{"n":"Rajasthali"},{"n":"Rangamati Sadar"},{"n":"Sajek (Rangamati)"}] },
  { name: "Rangpur", division: "Rangpur", thanas: [{"n":"Badarganj","a":["Badargonj"]},{"n":"Gangachara"},{"n":"Kaunia"},{"n":"Mitapukur","a":["Mithapukur"]},{"n":"Pirgacha"},{"n":"Pirganj","a":["Pirgonj"]},{"n":"Rangpur Sadar"},{"n":"Shatibari"},{"n":"Taraganj","a":["Taragonj"]}] },
  { name: "Satkhira", division: "Khulna", aka: ["Shatkhira"], thanas: [{"n":"Assasuni"},{"n":"Debhata"},{"n":"Kalaroa"},{"n":"Kaliganj"},{"n":"Patkelghata"},{"n":"Shatkhira sadar","a":["Satkhira Sadar"]},{"n":"Shyamnagar"},{"n":"Tala"}] },
  { name: "Shariatpur", division: "Dhaka", thanas: [{"n":"Bhedarganj"},{"n":"Damudya"},{"n":"Gosairhat"},{"n":"Naria"},{"n":"Shakipur"},{"n":"Shariatpur sadar"},{"n":"Zajira"}] },
  { name: "Sherpur", division: "Mymensingh", thanas: [{"n":"Jhenaigati"},{"n":"Nakla","a":["Nokla"]},{"n":"Nalitabari"},{"n":"Sherpur sadar"},{"n":"Sreebardi","a":["Sreebordi"]}] },
  { name: "Sirajganj", division: "Rajshahi", thanas: [{"n":"Belkuchi"},{"n":"Chowhali","a":["Chauhali"]},{"n":"Enayetpur"},{"n":"Kamarkhanda","a":["Kamarkhand"]},{"n":"Kazipur"},{"n":"Raiganj","a":["Raigonj"]},{"n":"Salanga"},{"n":"Shahjadpur"},{"n":"Sirajganj Sadar"},{"n":"Tarash"},{"n":"Ullapara"}] },
  { name: "Sunamganj", division: "Sylhet", thanas: [{"n":"Bishwamvapur","a":["Bishwambarpur"]},{"n":"chhatak"},{"n":"Derai"},{"n":"Dharmapasha"},{"n":"Dowarabazar"},{"n":"Jagannathpur"},{"n":"Jamalganj"},{"n":"Jauabazar (Chatok)"},{"n":"Moddonagar"},{"n":"Norshingpur"},{"n":"Raniganj"},{"n":"Shalla"},{"n":"Shantiganj"},{"n":"Sunamganj Sadar"},{"n":"Tahirpur"}] },
  { name: "Sylhet", division: "Sylhet", thanas: [{"n":"Ambarkhana"},{"n":"Balaganj"},{"n":"Beanibazar"},{"n":"Bishanath","a":["Bishwanath"]},{"n":"Burhan Uddin Bazar, Kanaighat"},{"n":"Companyganj upazila","a":["Companiganj"]},{"n":"Dhakadakshin (Golapganj)"},{"n":"Fenchuganj"},{"n":"gobindaganj"},{"n":"Golapganj"},{"n":"Gowainghat"},{"n":"Jalalabad","a":["Bimanbandar"]},{"n":"Jalalabad cantonment"},{"n":"Jintiapur","a":["Jaintiapur"]},{"n":"Kanaighat"},{"n":"Modina Market"},{"n":"Moglabazar"},{"n":"Osmaninagar"},{"n":"Shaheb Bazar"},{"n":"Shahporan","a":["Shah Poran"]},{"n":"South Surma","a":["Dakshinsurma"]},{"n":"Sylhet sadar"},{"n":"Uposhahar"},{"n":"Zakiganj"}] },
  { name: "Tangail", division: "Dhaka", thanas: [{"n":"Bara Chaona (Sakhipur)"},{"n":"Basail"},{"n":"Bastail, Mirzapur"},{"n":"Bhuapur"},{"n":"Bolla Rampur Kalihati"},{"n":"Delduar"},{"n":"Dhanbari"},{"n":"Elenga Kalihati"},{"n":"Ghatail"},{"n":"Gopalpur"},{"n":"Kalihati"},{"n":"Kedarpur Nagarpur"},{"n":"Madhupur"},{"n":"Mirzapur"},{"n":"Nagarpur"},{"n":"Sabalia"},{"n":"Sagardighi, Ghatail"},{"n":"Sakhipur"},{"n":"Tangail Sadar"}] },
  { name: "Thakurgaon", division: "Rangpur", thanas: [{"n":"Baliadangi"},{"n":"Haripur"},{"n":"Pirganj upazila","a":["Pirganj"]},{"n":"Ranisankail"},{"n":"Thakurgaon Sadar"}] },
];

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

/** Thana NAMES for a district — the strings that get stored on an order. */
export function thanasForDistrict(name) {
  return (findDistrict(name)?.thanas ?? []).map((t) => t.n);
}

/** Dropdown options: the Steadfast name, plus its official spellings as hidden
 * search keywords so "Jatrabari" finds "Jattrabari". */
export function thanaOptionsForDistrict(name) {
  return (findDistrict(name)?.thanas ?? []).map((t) => ({ value: t.n, label: t.n, keywords: t.a }));
}

/** True when `thana` belongs to `district` — by its own name or any alias, so
 * an address saved under an older spelling still validates. */
export function isThanaInDistrict(district, thana) {
  const k = key(thana);
  return (findDistrict(district)?.thanas ?? []).some((t) => key(t.n) === k || (t.a ?? []).some((a) => key(a) === k));
}

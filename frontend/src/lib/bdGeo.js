/** Bangladesh delivery districts and zones — Steadfast's list, verbatim.
 *
 * Both fields are now EXACTLY what Steadfast uses, fetched from their
 * `GET /police_stations` endpoint (portal.packzy.com/api/v1). DiecastBD ships
 * via Steadfast, so the merchant re-types every address into Steadfast's panel;
 * anything we spell differently is something they have to translate by hand.
 * Previously only the zones matched and the district still didn't — we showed
 * Chattogram/Bogura/Comilla where Steadfast says Chittagong/Bogra/Cumilla.
 * Merchant's call: mirror them on both.
 *
 * The visible cost, accepted deliberately: Steadfast splits the capital into
 * "Dhaka City" and "Dhaka Sub-Urban", so a Dhaka customer now picks one of the
 * two. That is a courier's internal boundary, not something anyone knows about
 * their own address, so it is softened in SEARCH rather than by re-labelling:
 * both entries answer to "Dhaka", and each carries its own zone names as hidden
 * keywords — type "Savar" and Dhaka Sub-Urban comes up, type "Dhanmondi" and
 * Dhaka City does. Nobody has to know which half they live in.
 *
 * `aka` also keeps the modern district spellings searchable, so a customer
 * typing "Chattogram" still finds Steadfast's "Chittagong". Zone-level `a`
 * entries are the official police/upazila spellings (143 of them), so "Jatrabari"
 * finds "Jattrabari" and "Uttara East" finds "Uttara". Aliases are search-only:
 * never displayed, never stored.
 *
 * Deriving those zone aliases is where the risk sat — edit distance alone
 * proposed Gulistan<-Gulshan (opposite ends of Dhaka), Lama<-Ruma and
 * Ramganj<-Ramgati. A name the courier already lists independently is a place,
 * not a misspelling of another; see scripts/generate-bd-geo.mjs, whose DENY and
 * MANUAL lists were reviewed by hand.
 *
 * Steadfast's "Zone Not Clear" catch-all row is dropped and duplicate rows
 * collapsed. No `division` field: Steadfast does not supply one and nothing
 * rendered it.
 *
 * To refresh: SF_KEY=... SF_SECRET=... node scripts/generate-bd-geo.mjs.
 * Credentials come from the environment and are never committed. Read the
 * printed alias pairings before committing.
 *
 * Bundle note: only the checkout and account routes import this, and both are
 * lazy — it never reaches the storefront bundle.
 */
export const BD_DISTRICTS = [
  { name: "Bagerhat", thanas: [{"n":"Bagerhat sadar"},{"n":"Chitalmari"},{"n":"Fakirhat"},{"n":"Kachua upazila","a":["Kachua"]},{"n":"Mollahat"},{"n":"Mongla"},{"n":"Morrelganj"},{"n":"Nul"},{"n":"Null"},{"n":"Rampal"},{"n":"Sarankhola"},{"n":"test thana"}] },
  { name: "Bandarban", thanas: [{"n":"Ali Kadam","a":["Alikadam"]},{"n":"Bandarban sadar"},{"n":"Lama"},{"n":"Naikhongchari","a":["Naikhongchhari"]},{"n":"Rowangchhari"},{"n":"Ruma"},{"n":"Thanchi"}] },
  { name: "Barguna", thanas: [{"n":"Amtali"},{"n":"Bamna"},{"n":"Barguna sadar"},{"n":"Betagi"},{"n":"Patharghata","a":["Pathorghata"]},{"n":"Taltali"}] },
  { name: "Barishal", aka: ["Barisal"], thanas: [{"n":"Agailjhara"},{"n":"Babuganj"},{"n":"Bakerganj"},{"n":"Banaripara"},{"n":"Barishal Sadar","a":["Barisal Sadar"]},{"n":"Charkaua"},{"n":"Goriarpar"},{"n":"Gouronadi","a":["Gournadi"]},{"n":"Hizla"},{"n":"Mehendiganj"},{"n":"Muladi"},{"n":"Natun Bazar"},{"n":"Wazirpur"}] },
  { name: "Bhola", thanas: [{"n":"Bhola Sadar"},{"n":"Borhanuddin","a":["Borhan Sddin"]},{"n":"Char fasson","a":["Charfesson"]},{"n":"Daulatkhan","a":["Doulatkhan"]},{"n":"Dularhat (Charfession)"},{"n":"KunjerHat"},{"n":"Lalmohan"},{"n":"Manpura","a":["Monpura"]},{"n":"Soshivusion"},{"n":"Tazumuddin"}] },
  { name: "Bogra", aka: ["Bogura"], thanas: [{"n":"Alamdighi","a":["Adamdighi"]},{"n":"Baropur (Bogura)"},{"n":"Bogura Sadar"},{"n":"Dhunat","a":["Dhunot"]},{"n":"Dhupchancia","a":["Dupchanchia"]},{"n":"Gabtoli","a":["Gabtali"]},{"n":"Kahaloo"},{"n":"Nandigram","a":["Nondigram"]},{"n":"Saraikandi"},{"n":"Shajahanpur"},{"n":"Sherpur"},{"n":"Shibganj"},{"n":"Sonatola","a":["Sonatala"]}] },
  { name: "Brahmanbaria", thanas: [{"n":"Akhaura"},{"n":"Aruail (Sarail)"},{"n":"Ashuganj"},{"n":"Bancharampur"},{"n":"Bijoynagar"},{"n":"Brahmanbaria Sadar"},{"n":"Chargach (Kasba)"},{"n":"Chatalpar Nasirnagar"},{"n":"Kasba"},{"n":"Krishnanagar (Nabinagar)"},{"n":"Nabinagar"},{"n":"Nasirnagar"},{"n":"Radhika (B Baria)"},{"n":"Rupasdi (Banchrampur)"},{"n":"Sarail"},{"n":"Shibpur (Brahmanbaria)"},{"n":"Shyamgram (Nabinagar)"}] },
  { name: "Chandpur", thanas: [{"n":"Babur Hat (Chandpur)"},{"n":"Chandpur Sadar"},{"n":"Chowrangi (Faridganj)"},{"n":"Dhakirgaon"},{"n":"Faridganj","a":["Faridgonj"]},{"n":"Haimchar"},{"n":"Hajiganj"},{"n":"Kachua"},{"n":"Matlab North"},{"n":"Motlab dokkhin","a":["Matlab South"]},{"n":"Palakhal (Kachua)"},{"n":"Shahrasti"}] },
  { name: "Chapainawabganj", thanas: [{"n":"Bholahat"},{"n":"Chapainawabganj sadar"},{"n":"Gomastapur","a":["Gomostapur"]},{"n":"Nachole","a":["Nachol"]},{"n":"Shibganj sadar","a":["Shibganj"]}] },
  { name: "Chittagong", aka: ["Chattogram"], thanas: [{"n":"Akbar Shah","a":["Akbarshah"]},{"n":"Anwara"},{"n":"Bakolia","a":["Bakoliya"]},{"n":"Bandar - CTG","a":["Bandar"]},{"n":"Banskhali","a":["Banshkhali"]},{"n":"Bayazid Bostami","a":["Bayazid"]},{"n":"Bhujpur"},{"n":"Boalkhali"},{"n":"CEPZ","a":["EPZ"]},{"n":"Chandanaish"},{"n":"Chandgaon"},{"n":"Chawk Bazar","a":["Chawkbazar"]},{"n":"Chittagong Sadar"},{"n":"Doublemooring","a":["Double Mooring"]},{"n":"Fatikchori","a":["Fatikchhari"]},{"n":"Halishahar"},{"n":"Hathazari"},{"n":"Karnaphuli"},{"n":"KeraniHat"},{"n":"Khulshi"},{"n":"Kotwali - CTG","a":["Kotwali"]},{"n":"Lohagara"},{"n":"Mirsharai"},{"n":"Pahartali"},{"n":"Panchlaish"},{"n":"Patenga"},{"n":"Patiya"},{"n":"Rangunia"},{"n":"Raozan"},{"n":"Sadarghat - CTG","a":["Sadarghat"]},{"n":"Sandwip"},{"n":"Satkania"},{"n":"Shantirhat(Patiya)-CTG"},{"n":"Sitakunda"},{"n":"Sitakunda ( Citygate)"},{"n":"Time Bazar (Banskhali)"},{"n":"Zorarganj"}] },
  { name: "Chuadanga", thanas: [{"n":"Alamdanga"},{"n":"Chuadanga Sadar"},{"n":"Damurhuda"},{"n":"Darshana"},{"n":"Jibannagar"}] },
  { name: "Cox's Bazar", thanas: [{"n":"Badarkhali (Chakaria)"},{"n":"Baraitoli (Chakaria)"},{"n":"Chakaria"},{"n":"Cox's Bazar Sadar","a":["Coxsbazar Sadar"]},{"n":"Dulahazara (Chakaria)"},{"n":"Eidgaon"},{"n":"Eidgor(Ramu)"},{"n":"Garjania (Ramu)"},{"n":"Gorakghata(Moheshkhali)"},{"n":"Khurushkul"},{"n":"Kutubdia"},{"n":"Link Road"},{"n":"Moheskhali","a":["Moheshkhali"]},{"n":"Nhila (Teknaf)"},{"n":"Palongkhali (Ukhiya)"},{"n":"Pekua"},{"n":"Ramu"},{"n":"Shamlapur (Teknaf)"},{"n":"Sonarpara(Ukhiya)"},{"n":"Teknaf,টেকনাফ","a":["Teknaf"]},{"n":"Ukhiya"}] },
  { name: "Cumilla", aka: ["Comilla"], thanas: [{"n":"Bangora-Bazar"},{"n":"Barura"},{"n":"Batisha (Chauddagram)"},{"n":"Bottali (Nangalkot)"},{"n":"Brahmanpara"},{"n":"Burichang"},{"n":"Cantonment ( Cumilla)"},{"n":"Chandina"},{"n":"Chauddagram"},{"n":"Cumilla Sadar South Model"},{"n":"Daudkandi"},{"n":"Debidwar"},{"n":"Gouripur (Cumilla)"},{"n":"Homna"},{"n":"Jahapur (Muradnagar)"},{"n":"Kandirpar"},{"n":"Kotbari"},{"n":"Kotwali Model"},{"n":"Laksam"},{"n":"Lalmai"},{"n":"Meghna"},{"n":"Metanghar(Muradnagar)"},{"n":"Monoharganj","a":["Monohargonj"]},{"n":"Mudafargonj"},{"n":"Muradnagar"},{"n":"Nangalkot"},{"n":"Nawabpur (Chandina)"},{"n":"Titas"}] },
  { name: "Dhaka City", aka: ["Dhaka","Adabor","Airport","Ati Bazar (Keraniganj)","Azompur","Badda","Banani","Bangshal","Bashundhara R/A","Battery Section","Bhashantek","Cantonment","Chalkbazar","Dakshin khan","Darus Salam","Demra","Dhanmondi","Gandaria","Gulistan","Gulshan","Hatirjheel","Hazaribag","Jattrabari","Kadamtali","Kafrul","Kalabagan","Kamrangirchar","Khilgaon","Khilkhet","Kotwali","Lalbagh","Mirpur","Mohammadpur","Motijheel","Mugda","New Market","Pallabi","Paltan","Panthapath","Purbachal","Ramna","Rampura","Rupnagar","Sabujbag","Shah Ali","Shah Ali Market","Shahbag","Shahjahanpur","Sher-e-Bangla Nagar","Shyampur","Sutrapur","Tejgaon","Tejgaon Industrial Area","Turag","Uttara","Uttarkhan","Vasantek","Vatara","Wari"], thanas: [{"n":"Adabor"},{"n":"Airport"},{"n":"Ati Bazar (Keraniganj)"},{"n":"Azompur"},{"n":"Badda"},{"n":"Banani"},{"n":"Bangshal"},{"n":"Bashundhara R/A"},{"n":"Battery Section"},{"n":"Bhashantek"},{"n":"Cantonment"},{"n":"Chalkbazar","a":["Chawkbazar"]},{"n":"Dakshin khan","a":["Dakshinkhan"]},{"n":"Darus Salam"},{"n":"Demra"},{"n":"Dhanmondi"},{"n":"Gandaria"},{"n":"Gulistan"},{"n":"Gulshan"},{"n":"Hatirjheel"},{"n":"Hazaribag","a":["Hazaribagh"]},{"n":"Jattrabari","a":["Jatrabari"]},{"n":"Kadamtali","a":["Kadamtoli"]},{"n":"Kafrul"},{"n":"Kalabagan"},{"n":"Kamrangirchar"},{"n":"Khilgaon"},{"n":"Khilkhet"},{"n":"Kotwali"},{"n":"Lalbagh"},{"n":"Mirpur","a":["Mirpur Model"]},{"n":"Mohammadpur"},{"n":"Motijheel"},{"n":"Mugda"},{"n":"New Market"},{"n":"Pallabi"},{"n":"Paltan","a":["Paltan Model"]},{"n":"Panthapath"},{"n":"Purbachal"},{"n":"Ramna","a":["Ramna Model"]},{"n":"Rampura"},{"n":"Rupnagar"},{"n":"Sabujbag","a":["Sabujbagh"]},{"n":"Shah Ali"},{"n":"Shah Ali Market"},{"n":"Shahbag","a":["Shahbagh"]},{"n":"Shahjahanpur"},{"n":"Sher-e-Bangla Nagar"},{"n":"Shyampur"},{"n":"Sutrapur"},{"n":"Tejgaon"},{"n":"Tejgaon Industrial Area"},{"n":"Turag"},{"n":"Uttara","a":["Uttara East","Uttara West"]},{"n":"Uttarkhan"},{"n":"Vasantek"},{"n":"Vatara"},{"n":"Wari"}] },
  { name: "Dhaka Sub-Urban", aka: ["Dhaka","Ashulia","Dhamrai","Dohar","Hemayetpur","Keraniganj Model","Nawabganj","Savar","South Keraniganj"], thanas: [{"n":"Ashulia"},{"n":"Dhamrai"},{"n":"Dohar"},{"n":"Hemayetpur"},{"n":"Keraniganj Model","a":["Keraniganj"]},{"n":"Nawabganj"},{"n":"Savar"},{"n":"South Keraniganj"}] },
  { name: "Dinajpur", thanas: [{"n":"Biral","a":["Birol"]},{"n":"Birampur"},{"n":"Birganj"},{"n":"Bochaganj"},{"n":"Chirirbandar"},{"n":"Dinajpur Sadar"},{"n":"Fulbari // ফুলবাড়ি","a":["Fulbari"]},{"n":"Ghoraghat"},{"n":"Hakimpur"},{"n":"Kaharole","a":["Kaharol"]},{"n":"Khansama"},{"n":"Khulahati"},{"n":"Nawabganj Upazila","a":["Nawabganj"]},{"n":"Parbatipur"}] },
  { name: "Faridpur", thanas: [{"n":"Alfadanga"},{"n":"Bhanga"},{"n":"Boalmari"},{"n":"Charbhadrasan"},{"n":"Faridpur Sadar"},{"n":"Madhukhali"},{"n":"Nagarkanda"},{"n":"Niltuli"},{"n":"Sadarpur"},{"n":"Shaltha","a":["Saltha"]}] },
  { name: "Feni", thanas: [{"n":"Chagalnaiya","a":["Chhagalnaiya"]},{"n":"Dagunbhuiyan","a":["Daganbhuiyan"]},{"n":"Feni sadar"},{"n":"Fulgazi"},{"n":"Mohipal"},{"n":"Parshuram"},{"n":"Sonagazi"}] },
  { name: "Gaibandha", thanas: [{"n":"Dariapur"},{"n":"Fulchari","a":["Phulchari"]},{"n":"Gabindaganj","a":["Gobindaganj"]},{"n":"Gaibandha Sadar"},{"n":"Palashbari"},{"n":"Sadullapur"},{"n":"Saghata"},{"n":"Sundarganj"}] },
  { name: "Gazipur", thanas: [{"n":"Gazipur Sadar"},{"n":"Kaliakair"},{"n":"Kaliakair Upazila"},{"n":"Kaliganj upazila","a":["Kaliganj"]},{"n":"kapasia"},{"n":"Kashimpur"},{"n":"Memberbari (Gazipur)"},{"n":"Nayanpur (Sreepur)"},{"n":"Rajendrapur"},{"n":"Sreepur"},{"n":"Tongi","a":["Tongi East","Tongi West"]}] },
  { name: "Gopalganj", thanas: [{"n":"Boultali"},{"n":"Gopalganj Sadar"},{"n":"kasiani","a":["Kashiani"]},{"n":"Kotalipara"},{"n":"Muksudpur"},{"n":"tungipara"}] },
  { name: "Habiganj", thanas: [{"n":"Ajmiriganj"},{"n":"Aushkandi (Nabiganj)"},{"n":"Bahubal"},{"n":"Baniachong"},{"n":"Chunarughat"},{"n":"Habiganj Sadar"},{"n":"Lakhai"},{"n":"Madhobpur","a":["Madhabpur"]},{"n":"Markuli (Nabiganj)"},{"n":"Nabiganj"},{"n":"Shayestaganj"}] },
  { name: "Jamalpur", thanas: [{"n":"Baksiganj","a":["Bokshiganj"]},{"n":"Dewanganj","a":["Dewangonj"]},{"n":"Digpait"},{"n":"Islampur"},{"n":"Jamalpur Sadar"},{"n":"Madarganj"},{"n":"Melandaha","a":["Melandah"]},{"n":"Nandina"},{"n":"Sarishabari"}] },
  { name: "Jashore", thanas: [{"n":"Abhaynagar"},{"n":"Bagharpara","a":["Bagherpara"]},{"n":"Bakchar"},{"n":"Chaugacha","a":["Chougachha"]},{"n":"Jashore Sadar"},{"n":"Jikhargacha","a":["Jhikargacha"]},{"n":"keshobpur","a":["Keshabpur"]},{"n":"Manirampur"},{"n":"Sharsha"}] },
  { name: "Jhalokati", aka: ["Jhalakathi"], thanas: [{"n":"Jhalokati sadar","a":["Jhalakathi Sadar"]},{"n":"Kathalia"},{"n":"Nalchity"},{"n":"Rajapur"}] },
  { name: "Jhenaidah", thanas: [{"n":"Dakbangla"},{"n":"Harinakunda","a":["Harinakundu"]},{"n":"Hatgopalpur"},{"n":"Jhenaidah Sadar"},{"n":"Kaliganj"},{"n":"Kotchandpur"},{"n":"Maheshpur","a":["Moheshpur"]},{"n":"Shailkupa"}] },
  { name: "Joypurhat", thanas: [{"n":"Akkelpur"},{"n":"Joypurhat Sadar"},{"n":"Kalai"},{"n":"Khetlal"},{"n":"Panchbibi"}] },
  { name: "Khagrachori", aka: ["Khagrachhari"], thanas: [{"n":"Dighinala"},{"n":"Guimara"},{"n":"khagrachari sadar","a":["Khagrachhari Sadar"]},{"n":"Laxmichari","a":["Laxmichhari"]},{"n":"Mahalchari","a":["Mohalchari"]},{"n":"Manikchhari","a":["Manikchari"]},{"n":"Matiranga"},{"n":"Panchari"},{"n":"Ramgarh"}] },
  { name: "Khulna", thanas: [{"n":"Batiaghata","a":["Botiaghata"]},{"n":"Circuit House"},{"n":"Dacope","a":["Dakop"]},{"n":"Daulatpur (Khulna)","a":["Daulatpur"]},{"n":"Dighalia","a":["Digholia"]},{"n":"Dumuria"},{"n":"Gollamari (Khulna)"},{"n":"Khulna Sadar"},{"n":"Koyra"},{"n":"Mujgunni"},{"n":"Paikgacha","a":["Paikgasa"]},{"n":"Phultala","a":["Fultola"]},{"n":"Rupsha"},{"n":"Terokhada"}] },
  { name: "Kishoreganj", thanas: [{"n":"Abdullahpur (Austagram)"},{"n":"Austagram"},{"n":"Bajitpur"},{"n":"Bhairab"},{"n":"Hossainpur"},{"n":"Itna"},{"n":"Karimganj","a":["Karimgonj"]},{"n":"Katiadi"},{"n":"kishoreganj Sadar"},{"n":"Kuliarchar"},{"n":"Mithamain","a":["Mithamoin"]},{"n":"Nikli"},{"n":"Pakundia"},{"n":"Tarail"}] },
  { name: "Kurigram", thanas: [{"n":"Bhurungamari"},{"n":"Char Rajibpur","a":["Charrajibpur"]},{"n":"Chilmari"},{"n":"fulbari"},{"n":"Kachakata"},{"n":"kurigram sadar"},{"n":"Nageshwari"},{"n":"Phulbari"},{"n":"Rajarhat"},{"n":"Raomari","a":["Rowmari"]},{"n":"Ulipur"}] },
  { name: "Kustia", aka: ["Kushtia"], thanas: [{"n":"Bheramara"},{"n":"Bittipara EB"},{"n":"Daulatpur"},{"n":"Khoksa"},{"n":"Kumarkhali"},{"n":"Kushtia Sadar"},{"n":"Mirpur upazila","a":["Mirpur"]}] },
  { name: "Lalmonirhat", thanas: [{"n":"Aditmari"},{"n":"Hatibandha"},{"n":"Kaliganj sadar","a":["Kaliganj"]},{"n":"Lalmonirhat Sadar"},{"n":"Patgram"}] },
  { name: "Laxmipur", aka: ["Lakshmipur"], thanas: [{"n":"Banchanagar (Laxmipur)"},{"n":"Chandraganj"},{"n":"Kamalnagar"},{"n":"Laxmipur Sadar"},{"n":"Raipur"},{"n":"Ramganj"},{"n":"Ramgati"}] },
  { name: "Madaripur", thanas: [{"n":"Dasar"},{"n":"Kalkini"},{"n":"Madaripur sadar"},{"n":"Rajoir"},{"n":"Shibchar"}] },
  { name: "Magura", thanas: [{"n":"Magura sadar"},{"n":"Mohammadpur upazila","a":["Mohammadpur"]},{"n":"Shalikha"},{"n":"Sreepur upazila","a":["Sreepur"]}] },
  { name: "Manikganj", thanas: [{"n":"Boro Sorundi (Manikganj)"},{"n":"Daulatpur upazila","a":["Doulatpur"]},{"n":"Ghior","a":["Gior"]},{"n":"Harirampur"},{"n":"Jamirta, Singair"},{"n":"Manikganj Sadar"},{"n":"Saturia"},{"n":"Shivalaya"},{"n":"Singair","a":["Singiar"]}] },
  { name: "Meherpur", thanas: [{"n":"Gangni"},{"n":"Meherpur sadar"},{"n":"Mujibnagar"}] },
  { name: "Moulvibazar", thanas: [{"n":"Barlekha (Moulvibazar)","a":["Barlekha"]},{"n":"Dakshinbhag"},{"n":"Juri"},{"n":"Kamolganj"},{"n":"Kulaura"},{"n":"Moulvibazar Sadar"},{"n":"Rajnagar"},{"n":"Robirbazar (Moulvibazar)"},{"n":"Sherpur Moulvibazar"},{"n":"Sreemangal"}] },
  { name: "Munshiganj", thanas: [{"n":"Gazaria","a":["Gajaria"]},{"n":"Louhajang","a":["Louhajanj"]},{"n":"Munshiganj Sadar"},{"n":"Sirajdikhan"},{"n":"Sreenagar"},{"n":"Tongibari"}] },
  { name: "Mymensingh", thanas: [{"n":"Bhaluka"},{"n":"Dhobaura"},{"n":"Fulbaria"},{"n":"Gafargaon"},{"n":"Gouripur"},{"n":"Haluaghat"},{"n":"Ishwarganj","a":["Iswarganj"]},{"n":"Muktagacha"},{"n":"Mymensingh Sadar"},{"n":"Nandail"},{"n":"Pagla"},{"n":"Phulpur"},{"n":"Shambhuganj"},{"n":"Square Masterbari (Bhaluka)"},{"n":"Tarakanda"},{"n":"Trishal"}] },
  { name: "Naogaon", thanas: [{"n":"Atrai"},{"n":"Badolgachi","a":["Badalgachi"]},{"n":"Dhamoirhat"},{"n":"Manda"},{"n":"Mohadevpur"},{"n":"Naogaon sadar"},{"n":"Niamatpur"},{"n":"Patnitala"},{"n":"Porsha"},{"n":"Raninagar"},{"n":"Sapahar"}] },
  { name: "Narail", thanas: [{"n":"Kalia"},{"n":"Lohagara"},{"n":"Naragati"},{"n":"Narail Sadar"}] },
  { name: "Narayanganj", thanas: [{"n":"Araihajar","a":["Araihazar"]},{"n":"Bandar"},{"n":"Fatullah"},{"n":"Kanchpur Highway"},{"n":"Narayanganj Sadar"},{"n":"Rupganj"},{"n":"Shiddhirganj"},{"n":"Sonargaon"}] },
  { name: "Narshindi", aka: ["Narsingdi"], thanas: [{"n":"Belabo"},{"n":"Ghorashal"},{"n":"Madhobdi"},{"n":"Monohardi"},{"n":"Narsingdi Sadar"},{"n":"Palash"},{"n":"Raipura"},{"n":"Shibpur"}] },
  { name: "Natore", thanas: [{"n":"Bagatipara"},{"n":"Baraigram"},{"n":"Bonpara Pourosova"},{"n":"Gopalpur Pourosova"},{"n":"Gurudaspur"},{"n":"Lalpur"},{"n":"Naldanga"},{"n":"Natore Sadar"},{"n":"Singra"}] },
  { name: "Netrokona", thanas: [{"n":"Atpara"},{"n":"Barhatta"},{"n":"Durgapur"},{"n":"Kalmakanda"},{"n":"Kendua"},{"n":"Khaliajuri"},{"n":"Madan"},{"n":"Mohonganj","a":["Mohongonj"]},{"n":"Netrokona Sadar"},{"n":"Parbadhala","a":["Purbadhala"]},{"n":"Shyamganj"}] },
  { name: "Nilphamari", thanas: [{"n":"Dimla"},{"n":"Domar"},{"n":"jaldhaka"},{"n":"kishoreganj","a":["Kishorganj"]},{"n":"Nilphamari Sadar"},{"n":"Saidpur","a":["Syedpur"]}] },
  { name: "Noakhali", thanas: [{"n":"Amishapara (Sonaimuri)"},{"n":"Begamganj","a":["Begumganj"]},{"n":"Chaprashirhat (Companiganj)"},{"n":"Chatkhil"},{"n":"Chhayani (Begumganj)"},{"n":"Companyganj","a":["Companiganj"]},{"n":"Hatiya","a":["Hatia"]},{"n":"Jamidarhat(Begumganj)"},{"n":"Kabir Hat","a":["Kabirhat"]},{"n":"Khalifarhat"},{"n":"Maijdee Bazar"},{"n":"Nijhum Dwip"},{"n":"Noakhali Sadar"},{"n":"Senbagh","a":["Senbug"]},{"n":"Sonaimuri","a":["Sonaimori"]},{"n":"Subarnachar"}] },
  { name: "Pabna", thanas: [{"n":"Ataikula (Pabna)"},{"n":"Atgharia","a":["Atghoria"]},{"n":"Bera"},{"n":"Bhangura"},{"n":"Chatmohar"},{"n":"Foridpur (Pabna)","a":["Faridpur"]},{"n":"Ishwardi","a":["Ishurdi"]},{"n":"Pabna Sadar"},{"n":"Santhia"},{"n":"Sujanagar"}] },
  { name: "Panchgarh", aka: ["Panchagarh"], thanas: [{"n":"Atwari"},{"n":"Boda"},{"n":"Debiganj"},{"n":"Panchgarh sadar Thana","a":["Panchagarh Sadar"]},{"n":"Tetulia"}] },
  { name: "Patuakhali", thanas: [{"n":"Bablatola"},{"n":"Bauphal"},{"n":"Dashmina"},{"n":"Dumki"},{"n":"Galachipa"},{"n":"Kalapara"},{"n":"Kalisuri"},{"n":"Mahipur"},{"n":"Mirzaganj"},{"n":"Patuakhali Sadar"},{"n":"Rangabali"}] },
  { name: "Pirojpur", thanas: [{"n":"Bhandaria"},{"n":"Inderhat"},{"n":"Kawkhali"},{"n":"Mathbaria"},{"n":"Nazirpur"},{"n":"Nesarabad"},{"n":"Pirojpur Sadar"},{"n":"Safa (Mathbaria)"},{"n":"Swarupkati"},{"n":"Zianagar"}] },
  { name: "Rajbari", thanas: [{"n":"(Goalanda Mor) Rajbari Office"},{"n":"Baliakandi"},{"n":"Goalananda","a":["Goalanda"]},{"n":"Kalukhali"},{"n":"pangsha","a":["Pangsa"]},{"n":"Rajbari Sadar"}] },
  { name: "Rajshahi", thanas: [{"n":"Airport (Rajshahi)","a":["Airport"]},{"n":"Bagha"},{"n":"Bagmara"},{"n":"Belpukur"},{"n":"Boalia"},{"n":"Chandrima Thana","a":["Chandrima"]},{"n":"Charghat"},{"n":"Damkura"},{"n":"Durgapur"},{"n":"Godagari"},{"n":"Kashiadanga","a":["Kasiadanga"]},{"n":"Katakhali"},{"n":"Kornohar","a":["Karnahar"]},{"n":"Matihar Thana","a":["Motihar"]},{"n":"Mohanpur","a":["Mohonpur"]},{"n":"Paba"},{"n":"Puthia"},{"n":"Rajpara"},{"n":"Rajshahi Sadar"},{"n":"Shah Makdam","a":["Shah Makhdum"]},{"n":"Tanore"}] },
  { name: "Rangamati", thanas: [{"n":"Bagaichhari","a":["Baghaichari"]},{"n":"Barkal"},{"n":"Belaichhari","a":["Belaichari"]},{"n":"Juraichhari","a":["Juraichari"]},{"n":"Kaptai"},{"n":"Kawkhali upazila","a":["Kawkhali"]},{"n":"Langadu"},{"n":"Naniarchar"},{"n":"Rajasthali"},{"n":"Rangamati Sadar"},{"n":"Sajek (Rangamati)"}] },
  { name: "Rangpur", thanas: [{"n":"Badarganj","a":["Badargonj"]},{"n":"Gangachara"},{"n":"Kaunia"},{"n":"Mitapukur","a":["Mithapukur"]},{"n":"Pirgacha"},{"n":"Pirganj","a":["Pirgonj"]},{"n":"Rangpur Sadar"},{"n":"Shatibari"},{"n":"Taraganj","a":["Taragonj"]}] },
  { name: "Shariatpur", thanas: [{"n":"Bhedarganj"},{"n":"Damudya"},{"n":"Gosairhat"},{"n":"Naria"},{"n":"Shakipur"},{"n":"Shariatpur sadar"},{"n":"Zajira"}] },
  { name: "Shatkhira", aka: ["Satkhira"], thanas: [{"n":"Assasuni"},{"n":"Debhata"},{"n":"Kalaroa"},{"n":"Kaliganj"},{"n":"Patkelghata"},{"n":"Shatkhira sadar","a":["Satkhira Sadar"]},{"n":"Shyamnagar"},{"n":"Tala"}] },
  { name: "Sherpur", thanas: [{"n":"Jhenaigati"},{"n":"Nakla","a":["Nokla"]},{"n":"Nalitabari"},{"n":"Sherpur sadar"},{"n":"Sreebardi","a":["Sreebordi"]}] },
  { name: "Sirajganj", thanas: [{"n":"Belkuchi"},{"n":"Chowhali","a":["Chauhali"]},{"n":"Enayetpur"},{"n":"Kamarkhanda","a":["Kamarkhand"]},{"n":"Kazipur"},{"n":"Raiganj","a":["Raigonj"]},{"n":"Salanga"},{"n":"Shahjadpur"},{"n":"Sirajganj Sadar"},{"n":"Tarash"},{"n":"Ullapara"}] },
  { name: "Sunamganj", thanas: [{"n":"Bishwamvapur","a":["Bishwambarpur"]},{"n":"chhatak"},{"n":"Derai"},{"n":"Dharmapasha"},{"n":"Dowarabazar"},{"n":"Jagannathpur"},{"n":"Jamalganj"},{"n":"Jauabazar (Chatok)"},{"n":"Moddonagar"},{"n":"Norshingpur"},{"n":"Raniganj"},{"n":"Shalla"},{"n":"Shantiganj"},{"n":"Sunamganj Sadar"},{"n":"Tahirpur"}] },
  { name: "Sylhet", thanas: [{"n":"Ambarkhana"},{"n":"Balaganj"},{"n":"Beanibazar"},{"n":"Bishanath","a":["Bishwanath"]},{"n":"Burhan Uddin Bazar, Kanaighat"},{"n":"Companyganj upazila","a":["Companiganj"]},{"n":"Dhakadakshin (Golapganj)"},{"n":"Fenchuganj"},{"n":"gobindaganj"},{"n":"Golapganj"},{"n":"Gowainghat"},{"n":"Jalalabad","a":["Bimanbandar"]},{"n":"Jalalabad cantonment"},{"n":"Jintiapur","a":["Jaintiapur"]},{"n":"Kanaighat"},{"n":"Modina Market"},{"n":"Moglabazar"},{"n":"Osmaninagar"},{"n":"Shaheb Bazar"},{"n":"Shahporan","a":["Shah Poran"]},{"n":"South Surma","a":["Dakshinsurma"]},{"n":"Sylhet sadar"},{"n":"Uposhahar"},{"n":"Zakiganj"}] },
  { name: "Tangail", thanas: [{"n":"Bara Chaona (Sakhipur)"},{"n":"Basail"},{"n":"Bastail, Mirzapur"},{"n":"Bhuapur"},{"n":"Bolla Rampur Kalihati"},{"n":"Delduar"},{"n":"Dhanbari"},{"n":"Elenga Kalihati"},{"n":"Ghatail"},{"n":"Gopalpur"},{"n":"Kalihati"},{"n":"Kedarpur Nagarpur"},{"n":"Madhupur"},{"n":"Mirzapur"},{"n":"Nagarpur"},{"n":"Sabalia"},{"n":"Sagardighi, Ghatail"},{"n":"Sakhipur"},{"n":"Tangail Sadar"}] },
  { name: "Thakurgaon", thanas: [{"n":"Baliadangi"},{"n":"Haripur"},{"n":"Pirganj upazila","a":["Pirganj"]},{"n":"Ranisankail"},{"n":"Thakurgaon Sadar"}] },
];

/** Normalised match key: case-, space- and punctuation-insensitive. */
const key = (s) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Two passes, and neither overwrites: a real district name must always beat an
// alias, and the FIRST district claiming an alias keeps it. That is what makes a
// legacy order stored as plain "Dhaka" resolve to Dhaka City — where 58 of the
// 66 zones are — rather than to Dhaka Sub-Urban, which is simply the later of
// the two in Steadfast's ordering.
const BY_KEY = new Map();
for (const d of BD_DISTRICTS) BY_KEY.set(key(d.name), d);
for (const d of BD_DISTRICTS) {
  for (const alias of d.aka ?? []) {
    const k = key(alias);
    if (!BY_KEY.has(k)) BY_KEY.set(k, d);
  }
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

/** Exactly what to select in Steadfast's own panel for a saved address.
 *
 * We display modern district names (Chattogram, Bogura, Comilla) while Steadfast
 * still uses the pre-2018 ones, and Steadfast splits the capital into "Dhaka
 * City" and "Dhaka Sub-Urban" — a distinction no customer should be asked to
 * make, but one the merchant must, and it is not guessable that Savar, Ashulia,
 * Dhamrai, Dohar, Hemayetpur, Nawabganj and the two Keraniganj zones sit on the
 * Sub-Urban side. Returning the pair to pick makes an order copy-paste for the
 * merchant instead of translation.
 *
 * Null for an unknown district; falls back to the stored thana string when the
 * zone isn't recognised, so an order placed before this data existed still
 * renders something useful rather than nothing.
 */
export function steadfastLocation(district, thana) {
  const d = findDistrict(district);
  if (!d) return null;
  const k = key(thana);
  const t = (d.thanas ?? []).find((x) => key(x.n) === k || (x.a ?? []).some((a) => key(a) === k));
  return { district: t?.s ?? d.sf ?? d.name, zone: t?.n ?? thana };
}


-- Create table for Indian states
CREATE TABLE public.indian_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Indian cities
CREATE TABLE public.indian_cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  state_id UUID NOT NULL REFERENCES public.indian_states(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, state_id)
);

-- Enable RLS for both tables
ALTER TABLE public.indian_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indian_cities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for indian_states (readable by all authenticated users)
CREATE POLICY "Authenticated users can view states" 
  ON public.indian_states 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create RLS policies for indian_cities (readable by all authenticated users)
CREATE POLICY "Authenticated users can view cities" 
  ON public.indian_cities 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Insert Indian states
INSERT INTO public.indian_states (name, code) VALUES
('Andhra Pradesh', 'AP'),
('Arunachal Pradesh', 'AR'),
('Assam', 'AS'),
('Bihar', 'BR'),
('Chhattisgarh', 'CG'),
('Goa', 'GA'),
('Gujarat', 'GJ'),
('Haryana', 'HR'),
('Himachal Pradesh', 'HP'),
('Jharkhand', 'JH'),
('Karnataka', 'KA'),
('Kerala', 'KL'),
('Madhya Pradesh', 'MP'),
('Maharashtra', 'MH'),
('Manipur', 'MN'),
('Meghalaya', 'ML'),
('Mizoram', 'MZ'),
('Nagaland', 'NL'),
('Odisha', 'OR'),
('Punjab', 'PB'),
('Rajasthan', 'RJ'),
('Sikkim', 'SK'),
('Tamil Nadu', 'TN'),
('Telangana', 'TG'),
('Tripura', 'TR'),
('Uttar Pradesh', 'UP'),
('Uttarakhand', 'UK'),
('West Bengal', 'WB'),
('Andaman and Nicobar Islands', 'AN'),
('Chandigarh', 'CH'),
('Dadra and Nagar Haveli and Daman and Diu', 'DH'),
('Delhi', 'DL'),
('Jammu and Kashmir', 'JK'),
('Ladakh', 'LA'),
('Lakshadweep', 'LD'),
('Puducherry', 'PY');

-- Insert major cities for each state (sample data)
WITH state_cities AS (
  SELECT 
    s.id as state_id,
    s.name as state_name,
    unnest(ARRAY[
      CASE s.name
        WHEN 'Andhra Pradesh' THEN ARRAY['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore']
        WHEN 'Arunachal Pradesh' THEN ARRAY['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Bomdila']
        WHEN 'Assam' THEN ARRAY['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur']
        WHEN 'Bihar' THEN ARRAY['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga']
        WHEN 'Chhattisgarh' THEN ARRAY['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg']
        WHEN 'Goa' THEN ARRAY['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda']
        WHEN 'Gujarat' THEN ARRAY['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar']
        WHEN 'Haryana' THEN ARRAY['Chandigarh', 'Faridabad', 'Gurgaon', 'Hisar', 'Panipat']
        WHEN 'Himachal Pradesh' THEN ARRAY['Shimla', 'Dharamshala', 'Manali', 'Kullu', 'Solan']
        WHEN 'Jharkhand' THEN ARRAY['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar']
        WHEN 'Karnataka' THEN ARRAY['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belgaum']
        WHEN 'Kerala' THEN ARRAY['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Kottayam', 'Thrissur']
        WHEN 'Madhya Pradesh' THEN ARRAY['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain']
        WHEN 'Maharashtra' THEN ARRAY['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad']
        WHEN 'Manipur' THEN ARRAY['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching']
        WHEN 'Meghalaya' THEN ARRAY['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Baghmara']
        WHEN 'Mizoram' THEN ARRAY['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib']
        WHEN 'Nagaland' THEN ARRAY['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha']
        WHEN 'Odisha' THEN ARRAY['Bhubaneswar', 'Cuttack', 'Puri', 'Rourkela', 'Berhampur']
        WHEN 'Punjab' THEN ARRAY['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala']
        WHEN 'Rajasthan' THEN ARRAY['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer']
        WHEN 'Sikkim' THEN ARRAY['Gangtok', 'Namchi', 'Geyzing', 'Mangan', 'Jorethang']
        WHEN 'Tamil Nadu' THEN ARRAY['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem']
        WHEN 'Telangana' THEN ARRAY['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar']
        WHEN 'Tripura' THEN ARRAY['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia']
        WHEN 'Uttar Pradesh' THEN ARRAY['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi']
        WHEN 'Uttarakhand' THEN ARRAY['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur']
        WHEN 'West Bengal' THEN ARRAY['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri']
        WHEN 'Andaman and Nicobar Islands' THEN ARRAY['Port Blair', 'Mayabunder', 'Rangat', 'Diglipur', 'Car Nicobar']
        WHEN 'Chandigarh' THEN ARRAY['Chandigarh']
        WHEN 'Dadra and Nagar Haveli and Daman and Diu' THEN ARRAY['Daman', 'Diu', 'Silvassa']
        WHEN 'Delhi' THEN ARRAY['New Delhi', 'Delhi', 'Gurgaon', 'Faridabad', 'Ghaziabad']
        WHEN 'Jammu and Kashmir' THEN ARRAY['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua']
        WHEN 'Ladakh' THEN ARRAY['Leh', 'Kargil', 'Diskit', 'Nyoma', 'Khalatse']
        WHEN 'Lakshadweep' THEN ARRAY['Kavaratti', 'Agatti', 'Minicoy', 'Amini', 'Andrott']
        WHEN 'Puducherry' THEN ARRAY['Puducherry', 'Karaikal', 'Mahe', 'Yanam']
        ELSE ARRAY['City 1', 'City 2', 'City 3']
      END
    ]) as city_name
  FROM public.indian_states s
)
INSERT INTO public.indian_cities (name, state_id)
SELECT city_name, state_id
FROM state_cities;

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('manager', 'employee', 'hr');

-- Create user_roles table (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create voice_sessions table
CREATE TABLE public.voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  transcript TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'recording', 'processing', 'draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create feedback_entries table
CREATE TABLE public.feedback_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.voice_sessions(id) ON DELETE CASCADE NOT NULL,
  ai_draft TEXT,
  final_feedback TEXT,
  competency_tags TEXT[],
  tone_analysis JSONB,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_entries ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for voice_sessions
CREATE POLICY "Managers can view their sessions" ON public.voice_sessions
  FOR SELECT USING (auth.uid() = manager_id OR auth.uid() = employee_id OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "Managers can create sessions" ON public.voice_sessions
  FOR INSERT WITH CHECK (auth.uid() = manager_id AND public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can update their sessions" ON public.voice_sessions
  FOR UPDATE USING (auth.uid() = manager_id);

CREATE POLICY "Managers can delete their sessions" ON public.voice_sessions
  FOR DELETE USING (auth.uid() = manager_id);

-- RLS Policies for feedback_entries
CREATE POLICY "Users can view feedback for their sessions" ON public.feedback_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.voice_sessions vs
      WHERE vs.id = session_id
      AND (vs.manager_id = auth.uid() OR vs.employee_id = auth.uid() OR public.has_role(auth.uid(), 'hr'))
    )
  );

CREATE POLICY "System can insert feedback" ON public.feedback_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.voice_sessions vs
      WHERE vs.id = session_id AND vs.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update feedback" ON public.feedback_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.voice_sessions vs
      WHERE vs.id = session_id AND vs.manager_id = auth.uid()
    )
  );

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-recordings', 'voice-recordings', false);

-- Storage policies
CREATE POLICY "Managers can upload audio" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_sessions_updated_at BEFORE UPDATE ON public.voice_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_entries_updated_at BEFORE UPDATE ON public.feedback_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
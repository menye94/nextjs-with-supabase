# Authentication Setup Guide

This guide will help you set up the authentication system with Supabase.

## Prerequisites

1. A Supabase project (create one at [database.new](https://database.new))
2. Your Supabase project URL and anon key

## Environment Variables

Make sure your `.env.local` file contains the correct Supabase environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
```

## Database Setup

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL to create the companies table and triggers:

```sql
-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_email TEXT,
  company_address TEXT,
  phone_number TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on owner_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (auth.uid() = owner_id);

-- Create policy to allow users to insert their own company
CREATE POLICY "Users can insert own company" ON companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Create policy to allow users to update their own company
CREATE POLICY "Users can update own company" ON companies
  FOR UPDATE USING (auth.uid() = owner_id);

-- Create policy to allow users to delete their own company
CREATE POLICY "Users can delete own company" ON companies
  FOR DELETE USING (auth.uid() = owner_id);

-- Create function to automatically create company record for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO companies (owner_id, company_name, company_email, company_address, phone_number)
  VALUES (NEW.id, NULL, NULL, NULL, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create company record when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Features Implemented

### Authentication
- **Sign-up form**: Email and password registration
- **Login form**: Email and password authentication
- **Automatic company creation**: When a user signs up, a company record is automatically created with null values
- **Dashboard redirect**: After successful login/signup, users are redirected to `/dashboard`
- **Protected routes**: Middleware protects authenticated routes and redirects to `/auth/login` if not logged in
- **Logout functionality**: Users can log out and are redirected to login page

### Route Protection
- `/dashboard` - Protected route, requires authentication
- `/auth/login` - Redirects to dashboard if already authenticated
- `/auth/sign-up` - Redirects to dashboard if already authenticated

### Database Structure
- `companies` table with user relationship
- Row Level Security (RLS) policies for data protection
- Automatic timestamps for created_at and updated_at
- Database trigger to automatically create company records on user signup

## Usage

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Sign up with email and password
4. You'll be automatically redirected to the dashboard
5. A company record will be created automatically in the database

## Troubleshooting

- Make sure your Supabase environment variables are correctly set
- Check that the database migration has been run in your Supabase project
- Verify that Row Level Security is enabled on the companies table
- Check the browser console and Supabase logs for any errors 
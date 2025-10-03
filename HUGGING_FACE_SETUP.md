# 🤗 Hugging Face AI Setup Guide

This guide will help you set up **free cloud-based AI** using Hugging Face for your health analytics.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Free Hugging Face API Key

1. **Go to Hugging Face**: https://huggingface.co/settings/tokens
2. **Sign up/Login** (free account)
3. **Create New Token**:
   - Click "New token"
   - Name: `health-empower-ai`
   - Type: `Read` (free tier)
   - Click "Generate"
4. **Copy the token** (starts with `hf_...`)

### Step 2: Add API Key to Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Settings → Edge Functions**
4. **Add Environment Variable**:
   - Name: `HUGGING_FACE_API_KEY`
   - Value: `hf_your_token_here` (paste your token)
   - Click "Save"

### Step 3: Deploy Updated Function

```bash
cd supabase
npx supabase functions deploy analyze-health-record
```

### Step 4: Test the Setup

```bash
node test-huggingface.js
```

## 🎯 How to Use

### In Your React App:
1. **Go to AI Insights page** (`/ai-insights`)
2. **Upload health record** or enter text
3. **Click "Analyze with AI"**
4. **Get instant analysis** with:
   - Summary
   - Key findings
   - Risk warnings
   - Recommendations
   - Confidence score

### Test Commands:

```bash
# Test health check
curl -X GET "https://wgcmusjsuziqjkzuaqkd.supabase.co/functions/v1/analyze-health-record" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4"

# Test AI analysis
curl -X POST "https://wgcmusjsuziqjkzuaqkd.supabase.co/functions/v1/analyze-health-record" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY211c2pzdXppcWprenVhcWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDA2MjMsImV4cCI6MjA3NDQ3NjYyM30.I-7myV1T0KujlqqcD0nepUU_qvh_7rnQ0GktbNXmmn4" \
  -H "Content-Type: application/json" \
  -d '{"testOnly": true}'
```

## 💰 Pricing

- **Free Tier**: 1,000 requests/month
- **No credit card required**
- **No local setup needed**

## 🔧 Troubleshooting

### Error: "Missing HUGGING_FACE_API_KEY"
- Make sure you added the API key to Supabase Edge Functions
- Check the key name is exactly `HUGGING_FACE_API_KEY`

### Error: "Authentication error"
- Verify your Hugging Face API key is correct
- Make sure the token has `Read` permissions

### Error: "Model not found"
- The default model is `microsoft/DialoGPT-medium`
- You can change it by setting `HUGGING_FACE_MODEL` environment variable

## 🎉 You're Done!

Your AI analytics should now work perfectly with **free cloud-based AI**!

## 📞 Support

If you need help:
1. Check the test script output
2. Look at Supabase Edge Function logs
3. Verify your API key is working at https://huggingface.co/settings/tokens

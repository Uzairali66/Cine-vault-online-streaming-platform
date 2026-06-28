# Cloudflare Setup Guide: Hide Your Real IP (Like hdmovie2)

## Why Cloudflare?

Cloudflare acts as a **reverse proxy** — all traffic goes through their servers first. Attackers, copyright trolls, and legal threats only see Cloudflare's IP addresses, never your origin server's real IP. hdmovie2 and every major streaming site uses this.

---

## Step 1: Create a Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com)
2. Click **"Sign Up"** (free plan is sufficient)
3. Enter your email and create a password
4. Verify your email

---

## Step 2: Add Your Domain

1. In the Cloudflare dashboard, click **"Add a Site"**
2. Enter your domain (e.g., `cinevault.app` or whatever you're using)
3. Click **"Add Site"**
4. Cloudflare will scan existing DNS records — let it finish
5. Select the **Free plan** ($0/month)

---

## Step 3: Update Your Nameservers (This is the CRITICAL Step)

After adding your domain, Cloudflare will display **2 nameservers** (example only — yours will be different):
```
dahlia.ns.cloudflare.com
leon.ns.cloudflare.com
```

Now go to your **domain registrar** (where you bought the domain):

| Registrar | Where to Change Nameservers |
|-----------|----------------------------|
| **Namecheap** | Dashboard → Domain List → Manage → Nameservers → Custom DNS |
| **GoDaddy** | My Products → Domain → DNS → Nameservers → Change |
| **Google Domains** | DNS → Default nameservers → Custom nameservers |
| **Porkbun** | Domains → Details → Nameservers |
| **NJALLA** | My Domains → Manage → Nameservers |

Replace the existing nameservers with the 2 Cloudflare ones. **It may take 24-48 hours to propagate**, but usually takes 5-30 minutes.

> ⚠️ **Once nameservers are updated, your domain won't work until Cloudflare's proxy is active.** Make sure you've set up all DNS records in Cloudflare (Step 4) before changing nameservers.

---

## Step 4: Configure DNS Records in Cloudflare

In Cloudflare dashboard → **DNS** → **Records**, add these:

### If you're on Vercel (most likely for this project):

| Type | Name | Value | Proxy Status |
|------|------|-------|-------------|
| **CNAME** | `@` | `your-project.vercel.app` | ☁️ **Proxied (orange cloud)** |
| **CNAME** | `www` | `your-project.vercel.app` | ☁️ **Proxied (orange cloud)** |

### If you're on a VPS (DigitalOcean, Linode, etc.):

| Type | Name | Value | Proxy Status |
|------|------|-------|-------------|
| **A** | `@` | `YOUR_SERVER_IP` | ☁️ **Proxied (orange cloud)** |
| **CNAME** | `www` | `yourdomain.com` | ☁️ **Proxied (orange cloud)** |

### The orange cloud icon is how you hide your IP:
- ☁️ **Orange (Proxied)** = Traffic routes through Cloudflare → your IP is hidden ✅
- ⚪ **Gray (DNS only)** = Traffic goes directly to your server → your IP is exposed ❌

**Every single record MUST be orange-cloud proxied.**

---

## Step 5: Enable SSL/TLS

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full** (not Flexible, not Full Strict)
   - *Full* = Encrypts between browser ↔ Cloudflare AND Cloudflare ↔ your server
   - Your Vercel/Netlify deployment already has SSL, so this works
3. Toggle **"Always Use HTTPS"** → ON

---

## Step 6: Create Security Settings

### Firewall Rule: Block Direct IP Access (Optional but Recommended)

1. Go to **Security** → **WAF** → **Custom Rules**
2. Click **"Create Rule"**
3. Rule name: `Block Non-Cloudflare Traffic`
4. Field: `IP Source Address`
5. Operator: `is not in`
6. Value: Paste Cloudflare's IP ranges from: https://www.cloudflare.com/ips/
7. Action: **Block**
8. Click **Deploy**

This ensures that even if someone discovers your real IP, they can't reach your server directly.

### Bot Fight Mode

1. Go to **Security** → **Bots**
2. Turn ON **"Bot Fight Mode"** (free feature)
3. This blocks scrapers and automated legal-discovery tools

---

## Step 7: Verify Your IP is Hidden

After nameservers propagate, run this in your terminal:

```bash
curl -I https://yourdomain.com
```

Look for these in the response headers:
```
cf-ray: 1234567890abc-DE
server: cloudflare
```

If you see `server: cloudflare`, your IP is proxied. If you see `server: Vercel` or similar, the proxy is not working.

Also check: [https://check.cloudflare.com/](https://check.cloudflare.com/)

---

## Step 8: Vercel-Specific: Lock Down to Cloudflare Only

Since you're using Vercel (React/Vite project), take these extra steps:

### Option A: Vercel Firewall (if available on your plan)
1. Go to Vercel dashboard → Project → Settings → **Firewall**
2. Add rule: Allow traffic only from Cloudflare IP ranges
3. Add Cloudflare IP ranges from: https://www.cloudflare.com/ips/

### Option B: Restrict via vercel.json
Add a `vercel.json` to your project root:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Option C: Use Cloudflare's Origin Certificate (Free, Strongest)
1. In Cloudflare: **SSL/TLS** → **Origin Server** → **Create Certificate**
2. Generate a free 15-year origin certificate
3. In Vercel: Settings → **Domains** → Add the certificate
4. Set SSL mode to **Full (Strict)**

This creates an encrypted tunnel between Cloudflare and Vercel, and the origin certificate isn't trusted by browsers directly — so direct IP access fails SSL handshake.

---

## Step 9: Bonus — Caching for Speed

1. Go to **Speed** → **Optimization**
2. Enable:
   - **Auto Minify** (HTML, CSS, JS) — makes your site faster
   - **Brotli** — better compression
3. Go to **Caching** → **Configuration**
4. Set **Browser Cache TTL** to 4 hours

---

## Common Mistakes to Avoid

| Mistake | Consequence |
|---------|------------|
| ❌ Leaving DNS records gray-clouded (DNS only) | Your real IP is publicly visible |
| ❌ Not updating nameservers | Cloudflare never activates |
| ❌ Using "Flexible" SSL | Traffic between Cloudflare and your server is unencrypted |
| ❌ Putting server IP in page content | Even with Cloudflare, if you leak your IP in code, it's visible |
| ❌ Using Cloudflare's default SSL setting | Doesn't affect IP hiding, but weaker encryption |

---

## What NOT to Do (From hdmovie2's Mistakes)

1. **Don't put your server IP in any JavaScript files** — Someone will find it
2. **Don't use the same domain for API calls if your API has a raw IP** — Always proxy the API subdomain too
3. **Don't disable Cloudflare for "maintenance mode"** — Temporarily switching to gray cloud exposes your IP

---

## Summary: What Gets Hidden vs. What Doesn't

| What Cloudflare Hides | What Cloudflare Does NOT Hide |
|----------------------|------------------------------|
| Your origin server IP | Your domain name (visible in WHOIS — use WhoisGuard) |
| Your hosting provider | Your site content (DMCA can still target your registrar) |
| Your server location | Your identity (if you registered domain without privacy) |
| DDoS attacks | Copyright infringement claims (DMCA still works against your registrar) |

> **Bottom line: Cloudflare alone is not enough.** You also need:
> - **WhoisGuard** (hide domain ownership)
> - **DMCA page** (✅ already done)
> - **Backup domains** (when one gets blocked)
> - **Business entity in lax jurisdiction** (offshore LLC)

---

## Verification Checklist

- [ ] Nameservers pointed to Cloudflare
- [ ] All DNS records have orange cloud (proxied)
- [ ] SSL set to **Full**
- [ ] Bot Fight Mode enabled
- [ ] Can see `cf-ray` header in curl response
- [ ] Can't find server IP via [whatsmydns.net](https://whatsmydns.net) or securitytrails.com
- [ ] Vercel/Netlify restricted to Cloudflare IPs only
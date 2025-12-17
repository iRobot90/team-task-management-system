# SSH Setup for VPS Deployment

## Adding Your SSH Key to the VPS

To deploy to your VPS, you need to add your public SSH key to the server.

### Method 1: Using ssh-copy-id (Recommended)

```bash
ssh-copy-id root@jesse-test.zng.dk
```

### Method 2: Manual Setup

1. **Copy your public key:**
   ```bash
   cat ~/.ssh/id_rsa.pub
   ```

2. **SSH into the VPS with password:**
   ```bash
   ssh root@jesse-test.zng.dk
   ```

3. **Add your key to authorized_keys:**
   ```bash
   mkdir -p ~/.ssh
   echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   exit
   ```

### Method 3: If you don't have an SSH key yet

1. **Generate a new SSH key:**
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```

2. **Start the SSH agent:**
   ```bash
   eval "$(ssh-agent -s)"
   ```

3. **Add your key to the agent:**
   ```bash
   ssh-add ~/.ssh/id_rsa
   ```

4. **Copy your public key and add it to the VPS (using Method 1 or 2)**

## Testing SSH Access

```bash
ssh root@jesse-test.zng.dk
```

If you can login without a password, SSH is set up correctly.

## Quick Deployment Commands

Once SSH is configured, you can deploy with:

```bash
# Make the deployment script executable
chmod +x deploy_to_vps.sh

# Run the deployment
./deploy_to_vps.sh
```

## Alternative: Manual Deployment

If the automated script doesn't work, you can deploy manually:

```bash
# Copy files to VPS
scp -r backend frontend root@jesse-test.zng.dk:/tmp/

# SSH into VPS
ssh root@jesse-test.zng.dk

# Run deployment commands on VPS
cd /tmp
# Follow the manual deployment steps from README_DEPLOYMENT.md
```

#!/bin/bash
# Passwordless Auth - Setup & Start Unified Script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

main_menu() {
    clear
    echo "================================================================================"
    echo "                    PASSWORDLESS AUTHENTICATION SYSTEM"
    echo "                        Setup and Development Starter"
    echo "================================================================================"
    echo
    echo "Choose an option:"
    echo
    echo "  1. Quick Setup (First time setup)"
    echo "  2. Start Development Menu"
    echo "  3. Exit"
    echo
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            setup
            ;;
        2)
            start_menu
            ;;
        3)
            exit_script
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            sleep 2
            main_menu
            ;;
    esac
}

setup() {
    clear
    echo "================================================================================"
    echo "                           QUICK SETUP"
    echo "================================================================================"
    echo
    
    # Check if .env already exists
    if [ -f "server/.env" ]; then
        echo -e "${YELLOW}⚠️  Server environment file already exists!${NC}"
        read -p "Do you want to overwrite it? (y/N): " overwrite
        if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
            echo "Setup cancelled."
            sleep 2
            main_menu
            return
        fi
    fi
    
    echo "📝 Creating server environment file..."
    
    # Create environment file
    cat > server/.env << 'EOF'
# Email Configuration
EMAIL_FROM=your-email@gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/passwordless-auth

# Application URLs
APP_URL=http://localhost:5173
API_URL=http://localhost:4000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
TOKEN_EXPIRY_MINUTES=15

# Server Configuration
PORT=4000
NODE_ENV=development
EOF
    
    echo -e "${GREEN}✅ Server environment file created at server/.env${NC}"
    
    # Install dependencies
    if [ -d "server/node_modules" ]; then
        echo "📦 Server dependencies already installed. Skipping..."
    else
        echo "📦 Installing server dependencies..."
        cd server && npm install && cd ..
    fi
    
    if [ -d "client/node_modules" ]; then
        echo "📦 Client dependencies already installed. Skipping..."
    else
        echo "📦 Installing client dependencies..."
        cd client && npm install && cd ..
    fi
    
    echo
    echo "================================================================================"
    echo -e "${GREEN}🎉 Setup complete!${NC}"
    echo "================================================================================"
    echo
    echo -e "${YELLOW}⚠️  IMPORTANT: Update server/.env with your email credentials${NC}"
    echo
    echo "Gmail Setup:"
    echo "  1. Enable 2-factor authentication on your Google account"
    echo "  2. Go to: https://myaccount.google.com/apppasswords"
    echo "  3. Generate an App Password for Mail"
    echo "  4. Use the App Password as EMAIL_PASS in server/.env"
    echo
    read -p "Press Enter to continue..."
    main_menu
}

start_menu() {
    clear
    echo "================================================================================"
    echo "                      DEVELOPMENT START MENU"
    echo "================================================================================"
    echo
    echo "Choose an option:"
    echo
    echo "  1. Start Server + MongoDB only (Docker)"
    echo "  2. Start Client only (Docker)"
    echo "  3. Start Both locally (Server + Client)"
    echo "  4. Start All with Docker Compose"
    echo "  5. Back to Main Menu"
    echo
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            start_server
            ;;
        2)
            start_client
            ;;
        3)
            start_both_local
            ;;
        4)
            start_docker
            ;;
        5)
            main_menu
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            sleep 2
            start_menu
            ;;
    esac
}

start_server() {
    clear
    echo "================================================================================"
    echo "Starting Server + MongoDB with Docker..."
    echo "================================================================================"
    echo
    docker-compose -f docker-compose.server.yml up --build
    if [ $? -ne 0 ]; then
        echo
        echo -e "${RED}❌ Failed to start Docker services${NC}"
        echo
        read -p "Press Enter to continue..."
    fi
    start_menu
}

start_client() {
    clear
    echo "================================================================================"
    echo "Starting Client with Docker..."
    echo "================================================================================"
    echo
    docker-compose -f docker-compose.client.yml up --build
    if [ $? -ne 0 ]; then
        echo
        echo -e "${RED}❌ Failed to start Docker services${NC}"
        echo
        read -p "Press Enter to continue..."
    fi
    start_menu
}

start_both_local() {
    clear
    echo "================================================================================"
    echo "Starting both services locally..."
    echo "================================================================================"
    echo
    
    # Start MongoDB
    echo "Starting MongoDB..."
    if docker-compose up -d mongo 2>/dev/null; then
        echo -e "${GREEN}✅ MongoDB started${NC}"
        sleep 3
    else
        echo -e "${YELLOW}⚠️  Could not start MongoDB with Docker${NC}"
        echo "Assuming MongoDB is running locally..."
    fi
    
    # Start Server in background
    echo "Starting Server..."
    cd server
    npm run dev &
    SERVER_PID=$!
    cd ..
    
    sleep 2
    
    # Start Client in background
    echo "Starting Client..."
    cd client
    npm run dev &
    CLIENT_PID=$!
    cd ..
    
    echo
    echo "================================================================================"
    echo "Services started!"
    echo "================================================================================"
    echo
    echo "📱 Client: http://localhost:5173"
    echo "🔧 Server: http://localhost:4000"
    echo "📊 Health: http://localhost:4000/health"
    echo
    echo "Press Ctrl+C to stop all services..."
    
    # Cleanup function
    cleanup() {
        echo
        echo "Stopping services..."
        kill $SERVER_PID $CLIENT_PID 2>/dev/null
        if docker info > /dev/null 2>&1; then
            docker-compose down
        fi
        echo "Done!"
        sleep 2
        start_menu
    }
    
    # Trap Ctrl+C
    trap cleanup SIGINT SIGTERM
    
    # Wait for processes
    wait
}

start_docker() {
    clear
    echo "================================================================================"
    echo "Starting all services with Docker Compose..."
    echo "================================================================================"
    echo
    docker-compose up --build
    if [ $? -ne 0 ]; then
        echo
        echo -e "${RED}❌ Failed to start Docker services${NC}"
        echo
        read -p "Press Enter to continue..."
    fi
    start_menu
}

exit_script() {
    clear
    echo
    echo "Thank you for using Passwordless Authentication System!"
    echo
    sleep 2
    exit 0
}

# Start the script
main_menu

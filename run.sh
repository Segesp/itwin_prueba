#!/bin/bash

# 🏙️ Urban Digital Twin Platform - Buenos Aires
# Script de desarrollo y gestión

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "🏙️  ======================================================"
echo "   GEMELO DIGITAL URBANO - BUENOS AIRES"
echo "   Plataforma Web con Tecnologías Modernas"
echo "   ======================================================"
echo -e "${NC}"

# Function to print colored messages
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
check_prerequisites() {
    print_info "Verificando prerequisitos..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado. Por favor instale Node.js 16+ desde https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js versión 16+ es requerida. Versión actual: $(node --version)"
        exit 1
    fi
    
    print_status "Node.js $(node --version) ✓"
    
    if ! command -v npm &> /dev/null; then
        print_error "npm no está instalado"
        exit 1
    fi
    
    print_status "npm $(npm --version) ✓"
}

# Install dependencies
install_dependencies() {
    print_info "Instalando dependencias..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_status "Dependencias instaladas correctamente"
    else
        print_status "Dependencias ya instaladas (saltando...)"
    fi
}

# Development server
start_dev() {
    print_info "Iniciando servidor de desarrollo..."
    print_info "La aplicación se abrirá en http://localhost:3000"
    print_warning "Presiona Ctrl+C para detener el servidor"
    
    npm start
}

# Build for production
build_production() {
    print_info "Construyendo para producción..."
    
    npm run build
    
    if [ $? -eq 0 ]; then
        print_status "Construcción completada exitosamente"
        print_info "Archivos generados en: ./dist/"
        
        # Show build stats
        echo -e "\n${CYAN}📊 Estadísticas de construcción:${NC}"
        ls -lh dist/ | grep -E '\.(js|css|html)$' | awk '{print "  📄 " $9 " - " $5}'
    else
        print_error "Error en la construcción"
        exit 1
    fi
}

# Serve production build locally
serve_production() {
    if [ ! -d "dist" ]; then
        print_warning "No se encontró build de producción. Construyendo..."
        build_production
    fi
    
    print_info "Sirviendo build de producción en http://localhost:3000"
    npm run serve
}

# Run tests
run_tests() {
    print_info "Ejecutando tests..."
    
    if [ -f "jest.config.js" ]; then
        npm test
    else
        print_warning "No se encontró configuración de tests"
    fi
}

# Lint code
lint_code() {
    print_info "Ejecutando linter..."
    
    npm run lint
    
    if [ $? -eq 0 ]; then
        print_status "Código lint-free ✓"
    else
        print_warning "Se encontraron issues de linting"
    fi
}

# Docker commands
docker_build() {
    print_info "Construyendo imagen Docker..."
    
    docker build -t gemelo-digital-urbano:latest .
    
    if [ $? -eq 0 ]; then
        print_status "Imagen Docker construida: gemelo-digital-urbano:latest"
    else
        print_error "Error construyendo imagen Docker"
        exit 1
    fi
}

docker_run() {
    print_info "Ejecutando contenedor Docker..."
    print_info "Aplicación disponible en http://localhost:3000"
    
    docker run -p 3000:80 --name urban-twin-container gemelo-digital-urbano:latest
}

docker_compose_up() {
    print_info "Iniciando stack completo con Docker Compose..."
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_status "Stack iniciado correctamente"
        print_info "Frontend: http://localhost:3000"
        print_info "Grafana: http://localhost:3002 (admin/grafana_password_2024)"
        print_info "MongoDB: localhost:27017"
        print_info "Redis: localhost:6379"
    else
        print_error "Error iniciando stack"
        exit 1
    fi
}

# Show help
show_help() {
    echo -e "\n${CYAN}🔧 Comandos disponibles:${NC}\n"
    echo -e "  ${GREEN}./run.sh dev${NC}           - Iniciar servidor de desarrollo"
    echo -e "  ${GREEN}./run.sh build${NC}         - Construir para producción"
    echo -e "  ${GREEN}./run.sh serve${NC}         - Servir build de producción"
    echo -e "  ${GREEN}./run.sh test${NC}          - Ejecutar tests"
    echo -e "  ${GREEN}./run.sh lint${NC}          - Ejecutar linter"
    echo -e "  ${GREEN}./run.sh install${NC}       - Instalar dependencias"
    echo -e "  ${GREEN}./run.sh docker:build${NC}  - Construir imagen Docker"
    echo -e "  ${GREEN}./run.sh docker:run${NC}    - Ejecutar contenedor Docker"
    echo -e "  ${GREEN}./run.sh docker:stack${NC}  - Iniciar stack completo"
    echo -e "  ${GREEN}./run.sh help${NC}          - Mostrar esta ayuda"
    echo ""
    echo -e "${PURPLE}📚 Recursos adicionales:${NC}"
    echo -e "  • Documentación: ./docs/"
    echo -e "  • README plataforma: ./PLATFORM.md"
    echo -e "  • Configuración: ./.env.example"
    echo ""
}

# Main script logic
case "$1" in
    "dev")
        check_prerequisites
        install_dependencies
        start_dev
        ;;
    "build")
        check_prerequisites
        install_dependencies
        build_production
        ;;
    "serve")
        check_prerequisites
        serve_production
        ;;
    "test")
        check_prerequisites
        install_dependencies
        run_tests
        ;;
    "lint")
        check_prerequisites
        install_dependencies
        lint_code
        ;;
    "install")
        check_prerequisites
        install_dependencies
        ;;
    "docker:build")
        docker_build
        ;;
    "docker:run")
        docker_run
        ;;
    "docker:stack")
        docker_compose_up
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_warning "Comando no reconocido: $1"
        show_help
        exit 1
        ;;
esac
from app.main import app

print("등록된 엔드포인트:")
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        methods = list(route.methods) if route.methods else []
        print(f"  {', '.join(methods):<10} {route.path}")

print("\n/api/detect 엔드포인트 확인:")
detect_routes = [r for r in app.routes if hasattr(r, 'path') and '/api/detect' in r.path]
if detect_routes:
    for route in detect_routes:
        print(f"  ✅ 찾음: {list(route.methods)} {route.path}")
else:
    print("  ❌ /api/detect 엔드포인트를 찾을 수 없습니다!")



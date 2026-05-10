import os
import glob

html_files = glob.glob('*.html')
for file in html_files:
    if file == 'layout-template.html':
        continue
    
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # 1. Add api-client.js and app.js before </body> if missing
    if '</body>' in content:
        scripts_to_add = []
        if 'api-client.js' not in content:
            scripts_to_add.append('<script src="api-client.js"></script>')
        if 'app.js' not in content:
            scripts_to_add.append('<script src="app.js"></script>')
        
        if scripts_to_add:
            script_tags = '\n    '.join(scripts_to_add) + '\n'
            content = content.replace('</body>', f'    {script_tags}</body>')
            modified = True

    # 2. Add logout link to sidebar-nav if it has a sidebar-nav and no logout link
    if '<nav class="sidebar-nav">' in content and 'data-logout' not in content:
        logout_link = '<hr style="margin: 15px 0; opacity: 0.2;">\n            <a href="#" data-logout><i class="fa-solid fa-right-from-bracket" style="color: #ef4444;"></i> <span style="color: #ef4444;">Logout</span></a>\n        </nav>'
        content = content.replace('</nav>', logout_link)
        modified = True

    if modified:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")

print("Done updating HTML files.")

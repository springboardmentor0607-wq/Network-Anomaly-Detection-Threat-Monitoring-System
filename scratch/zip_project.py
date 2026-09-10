import os
import zipfile

def zip_project(source_dir, output_filename):
    # Directories to exclude
    exclude_dirs = {'node_modules', 'venv', '__pycache__', '.git', 'scratch'}
    exclude_files = {output_filename}

    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Modify dirs in-place to exclude unwanted directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files or file.endswith('.zip'):
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)
                print(f"Added {arcname}")

if __name__ == '__main__':
    source = 'c:/Users/Vijayaprakash/Pictures/netshield-ai-complete-fixed/netshield-ai-updated'
    output = 'c:/Users/Vijayaprakash/Pictures/netshield-ai-complete-fixed/NetShield_AI_Complete.zip'
    zip_project(source, output)
    print(f"Successfully created zip file at {output}")

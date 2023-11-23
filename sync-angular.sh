dir=$(pwd)
echo $dir
git clone --filter=blob:none --no-checkout --sparse https://github.com/angular/angular.git --depth 1 --branch 17.0.4 ./.temp-git/compiler
cd ./.temp-git/compiler
git sparse-checkout set packages/compiler
git checkout 17.0.4
cd $dir
git clone --filter=blob:none --no-checkout --sparse https://github.com/angular/angular.git --depth 1 --branch 17.0.4 ./.temp-git/compiler-cli
cd ./.temp-git/compiler-cli
git sparse-checkout set packages/compiler-cli
git checkout 17.0.4
cd $dir
git clone --filter=blob:none --no-checkout --sparse https://github.com/angular/angular.git --depth 1 --branch 17.0.4 .temp-git/core
cd ./.temp-git/core
git sparse-checkout set packages/core/src
git checkout 17.0.4

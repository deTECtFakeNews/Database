#include <bits/stdc++.h>
using namespace std;

class UserNode {
public:
    string id;
    map<string, UserNode*> followers;
    UserNode(){}
    UserNode(string id){
        this->id = id;
    }
};

main(){

    return 0;
}
#include <bits/stdc++.h>
using namespace std;

class UserNode {
public:
    static int countCommonFollowers(UserNode u1, UserNode u2){

    }
    string id;
    map<string, UserNode*> followers;
    map<string, UserNode*> followings;
    UserNode(){}
    UserNode(string id){
        this->id = id;
    }
};

// getCommonFollowers
// Use set_intersection

// getCommonFollowings
// Use set_intersection

// getFollowRatio
// followers/following

// getFollowback
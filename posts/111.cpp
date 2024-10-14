#include <iostream>

class Animal {
    public:
    virtual void makeSound() {
        std::cout << "Animal make sound" << std::endl;
    }
};

class Dog : public Animal {
    public:
        void makeSound() override {
            std::cout << "dog barks" << std::endl;
        }
};

class Cat : public Animal {
    public:
        void makeSound() override {
            std::cout << "cat meows" << std::endl;
        }
};

int main() {
    Animal* animal1 = new Dog();
    Animal* animal2 = new Cat();

    animal1->makeSound();
    animal2->makeSound();

    delete animal1;
    delete animal2;

    return 0;
}
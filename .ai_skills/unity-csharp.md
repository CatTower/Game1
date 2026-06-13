---
name: unity-csharp
description: Coding guidelines for Unity C# scripting.
---
# Unity C# Scripting Guidelines

## 1. Lifecycle Execution Order
Understand when scripts run to avoid null reference exceptions.
- `Awake()`: Initialize references.
- `Start()`: Initialize game state.
- `FixedUpdate()`: Physics calculations (consistent time intervals).
- `Update()`: Frame rate dependent logic (inputs, simple movement).
- `LateUpdate()`: Camera tracking (runs after all Updates).

## 2. Component Reference Cache
Avoid calling `GetComponent` inside `Update()` as it is expensive.

```csharp
public class PlayerController : MonoBehaviour
{
    private Rigidbody2D rb;

    void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        float moveInput = Input.GetAxisRaw("Horizontal");
        rb.velocity = new Vector2(moveInput * 5f, rb.velocity.y);
    }
}
```

## 3. Object Pooling Pattern
Reuse frequently created/destroyed objects (like bullets or particles) instead of calling `Instantiate` and `Destroy` repeatedly.

```csharp
public class ObjectPool : MonoBehaviour
{
    public GameObject prefab;
    private Queue<GameObject> pool = new Queue<GameObject>();

    public GameObject Get()
    {
        if (pool.Count > 0)
        {
            GameObject obj = pool.Dequeue();
            obj.SetActive(true);
            return obj;
        }
        return Instantiate(prefab);
    }

    public void ReturnToPool(GameObject obj)
    {
        obj.SetActive(false);
        pool.Enqueue(obj);
    }
}
```
